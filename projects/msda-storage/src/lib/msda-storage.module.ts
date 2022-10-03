import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {  ModuleWithProviders, NgModule } from '@angular/core';

export interface StorageConfig {
  prefix?: string;
}

@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    CommonModule
  ],
  exports: [
    // MsdaStorageService
  ],
  providers:[]
})
export class MsdaStorageModule {
  public static prefix: string = '/api';
  public static keys = {
    i18n:'i18n',
    token: 'session-token',
    lang: 'lang',
    clientId: 'clientId',
    appVersions: 'appVersions'
  }
  /**
   * @param prefix - გადაეცით მეთოდის prefix , default: /api
   * @returns
   */
  public static forRoot(config: StorageConfig): ModuleWithProviders<MsdaStorageModule> {
    if(config.prefix)
      this.prefix = config.prefix;
    return {
      ngModule: MsdaStorageModule
    };
  }
}
