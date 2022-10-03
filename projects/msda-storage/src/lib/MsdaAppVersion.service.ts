import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsdaStorageModule } from './msda-storage.module';

export interface MsdaAppVersions {
 [x:string]: MsdaAppVersionItem
}


export interface MsdaAppVersionItem {
  build:number,
  version:string
}

@Injectable({
  providedIn: 'root'
})
export class MsdaAppVersionService {
  constructor() { }

  setAppVersion(appVersions: MsdaAppVersions) {
    const current = {...this.versions, ...appVersions};
    localStorage.setItem(MsdaStorageModule.keys.appVersions, JSON.stringify(current))
    return this.versions;
  }

  public get versions() {
    try {
      return JSON.parse(localStorage.getItem(MsdaStorageModule.keys.appVersions) || '{}')
    } catch (error) {
      console.error(error);
      return {}
    }
  }

}
