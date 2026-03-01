/**
 * Data Source Adapters Index
 * ==========================
 *
 * Import this file to register all available adapters with the registry.
 * Each adapter self-registers when imported.
 */

// SIS Adapters
export { cleverAdapter } from './clever';
export { classlinkAdapter } from './classlink';
export { powerschoolAdapter } from './powerschool';

// Assessment Adapters
export { nweaMapAdapter } from './nwea-map';
export { ireadyAdapter } from './iready';
export { renaissanceStarAdapter } from './renaissance-star';

// LMS Adapters
export { canvasAdapter } from './canvas';
export { googleClassroomAdapter } from './google-classroom';

// Re-export registry
export { DataSourceRegistry } from '../registry';
