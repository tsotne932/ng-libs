import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsdaStorageModule } from './msda-storage.module';


export interface MsdaResponse<T> {
  result : {
    data: T
  }
}

export interface AppTranlationVersion {
  [x:string]: number;
}

export  interface Translations {
  [x:string]: {
    ge : string;
    en : string;
  };
}
export interface MsdaI18n {
  [x:string]: {
    version: number;
    keywords: Translations
  };
}

export interface OriginalTranslation {
  keyword: string;
  translations: {
    ge : string;
    en : string;
  }
}


@Injectable({
  providedIn: 'root'
})
export class MsdaStorageTranslations {
  applicationAbbrs: string[] = [];

  constructor(private _httpClient:HttpClient) { }

  async loadTranslations(appKeywords: string[] = []) {
    this.applicationAbbrs = appKeywords;
    this._checkTranslationVersions();
  }

  private async _checkTranslationVersions(){
    const versions = await this._getRemoteTranslationVersions();
    if(versions){
      const i18n = this._getLocalTranslationVersions();
      const appsTranslationsToUpdate: AppTranlationVersion = this._getOutDatedAppKeywords(versions, i18n);
      const updatedAppTranslations = await this._getTranslations(appsTranslationsToUpdate);
      this._updateInStorage(updatedAppTranslations);
    }
  }

  private async _getRemoteTranslationVersions(): Promise<AppTranlationVersion | null>  {
    try{
      const { result: { data } } = await this._httpClient.get<MsdaResponse<AppTranlationVersion>>(`${MsdaStorageModule.prefix}/translations/versions`).toPromise();
      return data;
    } catch(err) {
      return null;
    }
  }

  private _getLocalTranslationVersions() {
    try {
      return JSON.parse(localStorage.getItem(MsdaStorageModule.keys.i18n) || '{}');
    } catch (error) {
      console.error(error);
      return {}
    }
  }

  private _getOutDatedAppKeywords(versions: AppTranlationVersion, i18n:MsdaI18n): AppTranlationVersion {
    const outDated: AppTranlationVersion = {};
    this.applicationAbbrs.forEach(abbr => {
      if(!i18n[abbr] || i18n[abbr].version < versions[abbr]){
        outDated[abbr] = versions[abbr]
      }
    });

    return outDated;
  }

  private async _getTranslations(applications: AppTranlationVersion): Promise<MsdaI18n> {
    const updatedTranslations: MsdaI18n = {};
    await Promise.all(Object.keys(applications).map( async application =>{
      try {
        const { result: { data } } = await this._httpClient.post<MsdaResponse<OriginalTranslation[]>>(`${MsdaStorageModule.prefix}/translations`, { data: { applications: [application] } }).toPromise();
        const keywords  = this._transformTranslations(data);
        updatedTranslations[application] = {
          version: applications[application],
          keywords: keywords
        }
      } catch(err){
        console.error(err);
      }
    }));
    return updatedTranslations;
  }

  private _transformTranslations(translations: OriginalTranslation[]) : Translations{
    const translationObject: Translations = {};

    translations.forEach(translation=>{
      translationObject[translation.keyword] = translation.translations;
    })

    return translationObject;
  }

  private _updateInStorage(newData: MsdaI18n) {
    try{
      const oldData = this._getLocalTranslationVersions();
      const toSave = {
        ...oldData,
        ...newData
      }
      localStorage.setItem(MsdaStorageModule.keys.i18n, JSON.stringify(toSave));
    } catch(err) {
      console.log(err);
    }
  }

  public get translations() {
    return this._getLocalTranslationVersions();
  }

}
