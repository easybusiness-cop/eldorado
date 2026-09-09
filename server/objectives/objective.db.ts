import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "../routes/supabase.routes.ts";
import type { Objective } from "./objective.types.ts";

export class ObjectiveDB {
  private static instance: ObjectiveDB;
  private supabaseClient: any = null;
  private isSupabaseActive: boolean = false;
  private fallbackFilePath: string;
  private useLocalFallback: boolean = true;
  private persistenceStatus: string = "unconfigured";
  private warningMessage: string = "";

  private constructor() {
    this.fallbackFilePath = path.join(process.cwd(), ".rufflo-store.json");
    this.initializeSupabase();
  }

  public static getInstance(): ObjectiveDB {
    if (!ObjectiveDB.instance) {
      ObjectiveDB.instance = new ObjectiveDB();
    }
    return ObjectiveDB.instance;
  }

  private initializeSupabase() {
    const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
    const url = normalizeSupabaseUrl(rawUrl);
    const key = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      ""
    ).trim();

    const isConfigured = Boolean(url && key && !url.includes("placeholder") && url.startsWith("http"));

    if (isConfigured) {
      try {
        this.supabaseClient = createClient(url, key);
        this.isSupabaseActive = true;
        this.useLocalFallback = false;
        this.persistenceStatus = "supabase";
        console.log("[ObjectiveDB] Supabase client initialized. Trying Postgres persistence.");
      } catch (err: any) {
        this.isSupabaseActive = false;
        this.useLocalFallback = true;
        this.persistenceStatus = "fallback_local";
        this.warningMessage = `Supabase initialization failed: ${err.message}. Fallen back to local JSON persistence.`;
        console.warn(`[ObjectiveDB WARNING] ${this.warningMessage}`);
      }
    } else {
      this.useLocalFallback = true;
      this.persistenceStatus = "fallback_local";
      this.warningMessage = "Supabase variables missing or unconfigured. Fallen back to local JSON file persistence at .rufflo-store.json";
      console.warn(`[ObjectiveDB WARNING] ${this.warningMessage}`);
    }
  }

  public getPersistenceInfo() {
    return {
      status: this.persistenceStatus,
      warning: this.warningMessage,
      fallbackPath: this.fallbackFilePath,
    };
  }

  public async saveObjective(objective: Objective): Promise<void> {
    if (this.isSupabaseActive && this.supabaseClient) {
      try {
        // Upsert serialized objective JSON into 'rufflo_objectives' table
        const { error } = await this.supabaseClient
          .from("rufflo_objectives")
          .upsert({
            id: objective.id,
            data: objective,
            updated_at: new Date().toISOString()
          }, { onConflict: "id" });

        if (error) {
          // If table does not exist (42P01) or other SQL errors, trigger local fallback
          if (error.code === "42P01") {
            this.useLocalFallback = true;
            this.warningMessage = "Supabase table 'rufflo_objectives' does not exist. Automatically fallback to local JSON file persistence.";
            console.warn(`[ObjectiveDB Table Missing] ${this.warningMessage}`);
            await this.saveToLocalFile(objective);
          } else {
            this.isSupabaseActive = false;
            this.useLocalFallback = true;
            this.warningMessage = `Supabase request failed: ${error.message}. Local JSON file fallback permanently enabled.`;
            console.warn(`[ObjectiveDB Disabled] ${this.warningMessage}`);
            await this.saveToLocalFile(objective);
          }
        } else {
          return;
        }
      } catch (err: any) {
        console.error("[ObjectiveDB] Supabase query failed, falling back to JSON:", err.message);
        this.isSupabaseActive = false;
        this.useLocalFallback = true;
        this.warningMessage = `Supabase query error: ${err.message}. Local JSON file database permanently engaged.`;
        await this.saveToLocalFile(objective);
      }
    } else {
      await this.saveToLocalFile(objective);
    }
  }

  public async loadObjectives(): Promise<Map<string, Objective>> {
    const objectivesMap = new Map<string, Objective>();

    if (this.isSupabaseActive && this.supabaseClient && !this.useLocalFallback) {
      try {
        const { data, error } = await this.supabaseClient
          .from("rufflo_objectives")
          .select("data");

        if (error) {
          if (error.code === "42P01") {
            this.useLocalFallback = true;
            this.warningMessage = "Supabase table 'rufflo_objectives' missing. Reading from local JSON.";
            return await this.loadFromLocalFile();
          }
          this.isSupabaseActive = false;
          this.useLocalFallback = true;
          this.warningMessage = `Supabase request failed: ${error.message}. Reading from local JSON.`;
          return await this.loadFromLocalFile();
        }

        if (data && Array.isArray(data)) {
          for (const row of data) {
            if (row.data && row.data.id) {
              objectivesMap.set(row.data.id, row.data);
            }
          }
          return objectivesMap;
        }
      } catch (err: any) {
        console.error("[ObjectiveDB] Load from Supabase failed, fallback to JSON:", err.message);
        this.isSupabaseActive = false;
        this.useLocalFallback = true;
        this.warningMessage = `Supabase read exception: ${err.message}. Loading from local JSON fallback.`;
        return await this.loadFromLocalFile();
      }
    }

    return await this.loadFromLocalFile();
  }

  private async saveToLocalFile(objective: Objective): Promise<void> {
    try {
      let objectives: Record<string, Objective> = {};
      try {
        const content = await fs.readFile(this.fallbackFilePath, "utf8");
        objectives = JSON.parse(content);
      } catch {
        // Ignored, file might not exist yet
      }

      objectives[objective.id] = objective;
      await fs.writeFile(this.fallbackFilePath, JSON.stringify(objectives, null, 2), "utf8");
    } catch (err: any) {
      console.error("[ObjectiveDB] Critical error saving to local file fallback:", err);
    }
  }

  private async loadFromLocalFile(): Promise<Map<string, Objective>> {
    const map = new Map<string, Objective>();
    try {
      const content = await fs.readFile(this.fallbackFilePath, "utf8");
      const parsed = JSON.parse(content);
      for (const id in parsed) {
        map.set(id, parsed[id]);
      }
    } catch {
      // Return empty map if file doesn't exist
    }
    return map;
  }
}

export const objectiveDB = ObjectiveDB.getInstance();
