/**
 * Data Sources Module
 * ===================
 *
 * Plug-and-play data source integration system.
 *
 * Usage:
 *
 * ```ts
 * import { DataSourceRegistry, DATA_SOURCE_CATEGORIES } from '@/lib/data/sources';
 *
 * // Get all registered adapters
 * const adapters = DataSourceRegistry.getAll();
 *
 * // Get adapters for a specific category
 * const sisAdapters = DataSourceRegistry.getByCategory('sis');
 *
 * // Get adapters available for a tier
 * const proAdapters = DataSourceRegistry.getForTier('pro');
 *
 * // Get a specific adapter
 * const clever = DataSourceRegistry.get('clever');
 * ```
 */

// Core registry and types
export {
  DataSourceRegistry,
  DATA_SOURCE_CATEGORIES,
  createAdapter,
  type DataSourceAdapter,
  type DataSourceCategory,
  type DataSourceConfig,
  type DataSourceStatus,
  type SyncResult,
  type SyncError,
  type SyncStatus,
  type SyncFrequency,
  type CredentialField,
  type DataTable,
} from './registry';

// Import adapters to register them
import './adapters/clever';
import './adapters/powerschool';
import './adapters/nwea-map';
import './adapters/iready';
import './adapters/renaissance-star';
import './adapters/canvas';
import './adapters/google-classroom';

// Re-export individual adapters for direct access
export {
  cleverAdapter,
  powerschoolAdapter,
  nweaMapAdapter,
  ireadyAdapter,
  renaissanceStarAdapter,
  canvasAdapter,
  googleClassroomAdapter,
} from './adapters';
