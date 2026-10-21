import { digitalIdentityService } from '../server/identity/digital-identity.service.ts';
import { emailInfrastructureService } from '../server/identity/email-infrastructure.service.ts';
import { applicationAccountManager } from '../server/identity/application-account-manager.ts';
import { credentialVault } from '../server/security/credential-vault.ts';
import { browserService } from '../server/tools/browser/browser.service.ts';
import fs from 'fs';
import path from 'path';

export async function runDigitalIdentityTestSuite(): Promise<{ passed: boolean; results: { name: string; success: boolean; details: string }[] }> {
  const results: { name: string; success: boolean; details: string }[] = [];
  let allPassed = true;

  const test = (name: string, success: boolean, details: string) => {
    results.push({ name, success, details });
    if (!success) allPassed = false;
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Two agents receive different identities
    // -------------------------------------------------------------------------
    const idMichael = digitalIdentityService.getOrCreateIdentity('org-alpha', 'michael');
    const idDwight = digitalIdentityService.getOrCreateIdentity('org-alpha', 'dwight');

    const test1Success =
      idMichael.identityId !== idDwight.identityId &&
      idMichael.emailAddress !== idDwight.emailAddress &&
      idMichael.workspaceId !== idDwight.workspaceId;

    test(
      'Two agents receive different identities and email addresses',
      test1Success,
      `Michael: ${idMichael.identityId} (${idMichael.emailAddress}) vs Dwight: ${idDwight.identityId} (${idDwight.emailAddress})`
    );

    // -------------------------------------------------------------------------
    // TEST 2: Two agents receive different browser profiles and directories
    // -------------------------------------------------------------------------
    const test2Success =
      idMichael.workspacePath !== idDwight.workspacePath &&
      idMichael.workspacePath.endsWith('org-alpha/michael') &&
      idDwight.workspacePath.endsWith('org-alpha/dwight');

    test(
      'Two agents receive distinct isolated browser workspace paths',
      test2Success,
      `Path 1: ${idMichael.workspacePath} | Path 2: ${idDwight.workspacePath}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Browser sessions and cookies persist across restart
    // -------------------------------------------------------------------------
    // Create an artificial persistent storage state file on disk
    const dwightWorkspaceDir = path.resolve(process.cwd(), '.rufflo-workspaces/org-alpha/dwight');
    if (!fs.existsSync(dwightWorkspaceDir)) {
      fs.mkdirSync(dwightWorkspaceDir, { recursive: true });
    }
    const sampleStorageState = {
      cookies: [
        { name: 'session_auth', value: 'secret_token_123', domain: '.dundermifflin.internal', path: '/', expires: Date.now() / 1000 + 86400 },
        { name: 'user_pref', value: 'dark_mode', domain: '.dundermifflin.internal', path: '/', expires: -1 },
      ],
      origins: [{ origin: 'https://dundermifflin.internal', localStorage: [{ name: 'theme', value: 'dark' }] }],
    };
    fs.writeFileSync(path.join(dwightWorkspaceDir, 'storage_state.json'), JSON.stringify(sampleStorageState, null, 2));

    // Inspect session via getAgentSession without launching Chromium
    const session = browserService.getAgentSession('dwight', 'org-alpha');
    const test3Success =
      session !== null &&
      session.isPersistent &&
      session.cookiesCount === 2 &&
      session.cookieDomains.includes('.dundermifflin.internal');

    test(
      'Browser sessions, cookies and local storage persist across restart',
      test3Success,
      `Loaded ${session?.cookiesCount || 0} persistent cookies from disk for domain: ${session?.cookieDomains?.join(', ')}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Email / Gmail OTP and verification link extraction
    // -------------------------------------------------------------------------
    const emailSample = emailInfrastructureService.receiveIncomingEmail('org-alpha', 'michael', {
      sender: 'auth-service@canva.com',
      subject: 'Your Canva verification code is 591823',
      body: 'Hello Michael, use verification code 591823 or click https://canva.com/verify?token=abc998 to confirm your account.',
    });

    const test4Success =
      emailSample.extraction.hasOtp &&
      emailSample.extraction.otpCode === '591823' &&
      Boolean(emailSample.extraction.verificationLink?.includes('canva.com/verify'));

    test(
      'Email infrastructure receives and extracts OTP codes and verification URLs',
      test4Success,
      `Extracted OTP: ${emailSample.extraction.otpCode} | Link: ${emailSample.extraction.verificationLink}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Unauthorized agent account access is denied
    // -------------------------------------------------------------------------
    // An agent with zero permissions
    digitalIdentityService.getOrCreateIdentity('org-alpha', 'unauthorized-intern', {
      permissions: [],
    });

    const deniedProv = await applicationAccountManager.provisionAccount(
      {
        agentId: 'unauthorized-intern',
        organizationId: 'org-alpha',
        platform: 'linkedin',
        accountHandle: 'intern_test',
      },
      [] // 0 permissions
    );

    const test5Success = !deniedProv.success && Boolean(deniedProv.error?.includes('lacks required permission'));

    test(
      'Unauthorized agent account access and provisioning is denied',
      test5Success,
      `Denied: "${deniedProv.error}"`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Multi-tenant organization boundaries enforced
    // -------------------------------------------------------------------------
    const idTenantA = digitalIdentityService.getOrCreateIdentity('org-alpha', 'michael');
    const idTenantB = digitalIdentityService.getOrCreateIdentity('org-tenant-beta', 'michael');

    const test6Success =
      idTenantA.identityId !== idTenantB.identityId &&
      idTenantA.organizationId === 'org-alpha' &&
      idTenantB.organizationId === 'org-tenant-beta';

    test(
      'Multi-tenant organization boundaries are strictly isolated',
      test6Success,
      `Tenant A ID: ${idTenantA.identityId} vs Tenant B ID: ${idTenantB.identityId}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Account provisioning with human assistance check
    // -------------------------------------------------------------------------
    const provLinkedIn = await applicationAccountManager.provisionAccount(
      {
        agentId: 'dwight',
        organizationId: 'org-alpha',
        platform: 'linkedin',
        accountHandle: 'dwight_security',
        desiredPassword: 'SecurePassword123!',
      },
      ['accounts:manage']
    );

    const test7Success =
      provLinkedIn.success &&
      provLinkedIn.account?.platform === 'linkedin' &&
      provLinkedIn.account?.status === 'pending_human_assistance' &&
      provLinkedIn.requiresHumanAssistance === true;

    test(
      'Account provisioning requests human assistance for strict platform gates',
      test7Success,
      `Platform: ${provLinkedIn.account?.platform} | Status: ${provLinkedIn.account?.status} | Reason: ${provLinkedIn.assistanceReason}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Credential Vault AES-256-GCM encryption, decryption, and revocation
    // -------------------------------------------------------------------------
    const secretScope = { orgId: 'org-alpha', agentId: 'dwight', secretId: 'test_token' };
    const secretPlaintext = 'ghp_super_secret_github_token_999888777';

    await credentialVault.storeSecret(secretScope, secretPlaintext, { purpose: 'ci_deploy' });
    const decrypted = await credentialVault.retrieveSecret(secretScope);
    const encryptionSuccess = decrypted === secretPlaintext;

    // Revoke
    const revoked = await credentialVault.revokeSecret(secretScope);
    const afterRevoke = await credentialVault.retrieveSecret(secretScope);
    const revocationSuccess = revoked && afterRevoke === null;

    test(
      'Credential Vault AES-256-GCM encryption, retrieval, and revocation work cleanly',
      encryptionSuccess && revocationSuccess,
      `Encrypted/Decrypted: ${encryptionSuccess} | Revoked: ${revocationSuccess}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Secret redaction prevents leakage in logs
    // -------------------------------------------------------------------------
    const leakSample = `User logged in with bearer sk-abcdef1234567890abcdef and password="mySecretPassword123"`;
    const redacted = credentialVault.redactSecrets(leakSample);
    const redactionSuccess =
      !redacted.includes('sk-abcdef1234567890abcdef') &&
      !redacted.includes('mySecretPassword123') &&
      redacted.includes('[REDACTED]');

    test(
      'Credential Vault redacts secrets and API keys from logs and outputs',
      redactionSuccess,
      `Redacted sample: "${redacted}"`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Existing browser endpoints continue working
    // -------------------------------------------------------------------------
    const browserStatus = await browserService.getBrowserStatus();
    const test10Success =
      Boolean(browserStatus.browser) &&
      browserStatus.status === 'online' &&
      browserStatus.isOpenSource === true;

    test(
      'Existing browser service and endpoints preserved and fully operational',
      test10Success,
      `Browser: ${browserStatus.browser} | Version: ${browserStatus.version} | Sessions: ${browserStatus.activeSessions}`
    );
  } catch (err: any) {
    test('Digital Identity Test Suite Fatal Error', false, err.message);
  }

  return { passed: allPassed, results };
}

// Auto-run if executed directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runDigitalIdentityTestSuite().then((r) => {
    console.log(JSON.stringify(r, null, 2));
    if (!r.passed) process.exit(1);
  });
}
