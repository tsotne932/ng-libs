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

export interface SidenavConfig {
  imagesSourceUrl?: string;
  httpInterceptor?: Type<any>;
  env: any
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
    FlexLayoutModule
  ],
  exports: [
    MsdaSidenavComponent
  ],
  providers: []
})
export class MsdaSidenavModule {
  public static imagesSourceUrl: string = '';
  public static isPrivate: boolean | undefined;
  public static env: 'production' | 'training' | 'staging' | 'development' = 'staging';

  /**
   * @param imagesSourceUrl - მისამართი სადაც განთავსებულია აპლიკაციის svg ლოგოები
   * @param env -- 'production' | 'training' | 'staging' | 'development'
   * @returns
   */
  public static forRoot(config: SidenavConfig): ModuleWithProviders<MsdaSidenavModule> {
    this.imagesSourceUrl = config.imagesSourceUrl || 'https://sso.municipal.gov.ge';
    this.env = config.env;
    return {
      ngModule: MsdaSidenavModule
    };
  }
}
