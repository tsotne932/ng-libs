import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {  ModuleWithProviders, NgModule } from '@angular/core';
import { MsdaStorage } from './msda-storage.service';

export interface StorageConfig {
  prefix?: string;
}

@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    CommonModule
  ],
  exports: [],
  providers:[MsdaStorage]
})
export class MsdaStorageModule {}
