/* tslint:disable */
/* eslint-disable */
/**
 * Hospital Equipment Management API
 * Storage Equipment management for hospital
 *
 * The version of the OpenAPI document: 1.0.0
 * Contact: xskrabakf@stuba.sk
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface EquipmentUpdate
 */
export interface EquipmentUpdate {
    /**
     * Name of the equipment
     * @type {string}
     * @memberof EquipmentUpdate
     */
    name?: string;
    /**
     * Serial number of the equipment
     * @type {string}
     * @memberof EquipmentUpdate
     */
    serialNumber?: string;
    /**
     * Manufacturer of the equipment
     * @type {string}
     * @memberof EquipmentUpdate
     */
    manufacturer?: string;
    /**
     * Model of the equipment
     * @type {string}
     * @memberof EquipmentUpdate
     */
    model?: string;
    /**
     * Location of the equipment in the hospital
     * @type {string}
     * @memberof EquipmentUpdate
     */
    location?: string;
    /**
     * Service interval in days
     * @type {number}
     * @memberof EquipmentUpdate
     */
    serviceInterval?: number;
    /**
     * Date of last service
     * @type {Date}
     * @memberof EquipmentUpdate
     */
    lastService?: Date;
    /**
     * Life expectancy in years
     * @type {number}
     * @memberof EquipmentUpdate
     */
    lifeExpectancy?: number;
    /**
     * 
     * @type {string}
     * @memberof EquipmentUpdate
     */
    status?: EquipmentUpdateStatusEnum;
    /**
     * Additional notes about the equipment
     * @type {string}
     * @memberof EquipmentUpdate
     */
    notes?: string;
}


/**
 * @export
 */
export const EquipmentUpdateStatusEnum = {
    Operational: 'operational',
    InRepair: 'in_repair',
    Faulty: 'faulty',
    Decommissioned: 'decommissioned'
} as const;
export type EquipmentUpdateStatusEnum = typeof EquipmentUpdateStatusEnum[keyof typeof EquipmentUpdateStatusEnum];


/**
 * Check if a given object implements the EquipmentUpdate interface.
 */
export function instanceOfEquipmentUpdate(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function EquipmentUpdateFromJSON(json: any): EquipmentUpdate {
    return EquipmentUpdateFromJSONTyped(json, false);
}

export function EquipmentUpdateFromJSONTyped(json: any, ignoreDiscriminator: boolean): EquipmentUpdate {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': !exists(json, 'name') ? undefined : json['name'],
        'serialNumber': !exists(json, 'serialNumber') ? undefined : json['serialNumber'],
        'manufacturer': !exists(json, 'manufacturer') ? undefined : json['manufacturer'],
        'model': !exists(json, 'model') ? undefined : json['model'],
        'location': !exists(json, 'location') ? undefined : json['location'],
        'serviceInterval': !exists(json, 'serviceInterval') ? undefined : json['serviceInterval'],
        'lastService': !exists(json, 'lastService') ? undefined : (new Date(json['lastService'])),
        'lifeExpectancy': !exists(json, 'lifeExpectancy') ? undefined : json['lifeExpectancy'],
        'status': !exists(json, 'status') ? undefined : json['status'],
        'notes': !exists(json, 'notes') ? undefined : json['notes'],
    };
}

export function EquipmentUpdateToJSON(value?: EquipmentUpdate | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'serialNumber': value.serialNumber,
        'manufacturer': value.manufacturer,
        'model': value.model,
        'location': value.location,
        'serviceInterval': value.serviceInterval,
        'lastService': value.lastService === undefined ? undefined : (value.lastService.toISOString().substr(0,10)),
        'lifeExpectancy': value.lifeExpectancy,
        'status': value.status,
        'notes': value.notes,
    };
}

