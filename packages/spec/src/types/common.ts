/** ISO 8601 datetime string */
export type ISODateTime = string;

/** ULID identifier */
export type ULID = string;

/** Status shared by many entities */
export type EntityStatus = 'active' | 'inactive' | 'archived';

/** Base fields shared by all entities */
export interface BaseEntity {
  id: ULID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
