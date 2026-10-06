import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

if (!getApps().length) {
  // Read the projectId directly from firebase-applet-config.json
  // which was generated in the workspace root by the set_up_oauth tool.
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();
