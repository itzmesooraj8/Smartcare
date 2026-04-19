/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_MOCK_AUTH?: string;
	readonly VITE_DEMO_PATIENT_EMAIL?: string;
	readonly VITE_DEMO_PATIENT_PASSWORD?: string;
	readonly VITE_DEMO_DOCTOR_EMAIL?: string;
	readonly VITE_DEMO_DOCTOR_PASSWORD?: string;
	readonly VITE_DEMO_ADMIN_EMAIL?: string;
	readonly VITE_DEMO_ADMIN_PASSWORD?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
