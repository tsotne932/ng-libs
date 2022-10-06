import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Type } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { SelectClientComponent } from './components/select-client/select-client.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MsdaSidenavComponent } from './components/msda-sidenav.component';
import {  MsdaStorageModule } from 'msda-storage';

export interface SidenavConfig {
  imagesSourceUrl?: string;
  env: any,
  publicApiPreffix?: string;
  appAbbr: string;
}

@NgModule({
  declarations: [

    SelectClientComponent,
    MsdaSidenavComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    HttpClientModule,
    FlexLayoutModule,
    MsdaStorageModule
  ],
  exports: [
    MsdaSidenavComponent
  ],
  providers: []
})
export class MsdaSidenavModule {
  public static imagesSourceUrl: string = '';
  public static publicApiPreffix: string = '/api';
  public static isPrivate: boolean | undefined;
  public static currentAppAbbreviation: string | undefined;
  public static env: 'production' | 'training' | 'staging' | 'development' = 'staging';

  /**
   * @param publicApiPreffix - default - '/api' .  public-api-ის prefix (საჭიროა მაშინ როდესაც proxy- ით გავდივართ public-api მეთოდებზე)
   * @param imagesSourceUrl - მისამართი სადაც განთავსებულია აპლიკაციის svg ლოგოები
   * @param appAbbr - აპლიკაციის აბრევიატურა
   * @param env -- 'production' | 'training' | 'staging' | 'development'
   * @returns
   */
  public static forRoot(config: SidenavConfig): ModuleWithProviders<MsdaSidenavModule> {
    this.imagesSourceUrl = config.imagesSourceUrl || 'https://sso.municipal.gov.ge';
    this.publicApiPreffix = config.publicApiPreffix || '/api'
    this.currentAppAbbreviation = config.appAbbr;
    this.env = config.env;
    return {
      ngModule: MsdaSidenavModule
    };
  }
}
