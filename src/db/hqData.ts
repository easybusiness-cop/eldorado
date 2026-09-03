import {
  INITIAL_FLOORS,
  INITIAL_DEPARTMENTS_MAP,
  INITIAL_MEETINGS,
  INITIAL_CROSS_WORKFLOWS,
  INITIAL_MEMORIES
} from './companyDb';
import { hqService } from '../services/hqService';
import { OrgChartNode } from '../types';

export {
  INITIAL_FLOORS,
  INITIAL_DEPARTMENTS_MAP,
  INITIAL_MEETINGS,
  INITIAL_CROSS_WORKFLOWS,
  INITIAL_MEMORIES
};

export function getOrgChartTree(): OrgChartNode {
  return hqService.getOrgChart();
}
