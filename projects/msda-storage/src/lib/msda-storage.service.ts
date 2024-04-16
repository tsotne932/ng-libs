import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


const KEYS = {
  i18n: 'i18n',
  token: 'session-token',
  lang: 'lang',
  clientId: 'clientId',
  appVersions: 'appVersions',
  orgClientId: 'orgClientId'
}

@Injectable({
  providedIn: 'root'
})
export class MsdaStorage {
  applicationAbbrs: string[] = [];
  private _clientId?: number | null;
  private _token?: string | null = '';
  private _orgClientId?: number | null;
  private _apiPrefix: string = '/api';
  loadAllTranslations: boolean = false;
  private _translationVersions: any;
  constructor(private _httpClient: HttpClient) { }

  /**
   * Load Translations with App abbreviations
   * @param {String} appKeywords[]
   * @param {String} prefix optional parameter
   */
  async loadTranslations(appKeywords: string[]) {
    if (appKeywords && appKeywords.length) {
      this.loadAllTranslations = appKeywords.includes('*');
      this.applicationAbbrs = appKeywords;
      await this._checkTranslationVersions();
    }
  }

  /**
   * set clientId to storage
   * @param {number} clientId
   */
  async setClientId(clientId: number | null, setInSession?: boolean) {
    if (setInSession) {
      try {
        await this._setSessionClient(clientId).toPromise();
        return { success: this._setClientId(clientId) };
      } catch (error) {
        return { success: false, error };
      }
    }
    return { success: this._setClientId(clientId) };
  }

  get clientId() {
    return this._getClientId();
  }

  /**
   * remove clientId
   * @param {number} clientId
   */
  public removeClientId() {
    this.setClientId(null);
  }

  private _setClientId(clientId: number | null) {
    this._clientId = clientId;
    if (clientId)
      localStorage.setItem(KEYS.clientId, clientId.toString());
    else localStorage.removeItem(KEYS.clientId);
    return true;
  }

  private _getClientId() {
    try {
      this._clientId = Number(localStorage.getItem(KEYS.clientId));
      return this._clientId;
    } catch (error) {
      console.error(error);
      return null;
    }
  }


  /**
   * set lang to storage
   * @param {string} lang
   */
  setLang(lang: string) {
    this._setLang(lang);
  }
  /**
   *  get lang
   */
  public static get lang() {
    return localStorage.getItem(KEYS.lang);
  }

  private _setLang(lang: string | null) {
    if (lang)
      localStorage.setItem(KEYS.lang, lang);
    else localStorage.removeItem(KEYS.lang);
  }

  private _getLang() {
    return localStorage.getItem(KEYS.lang);
  }

  /**
   * common set item
   * @param {string} key
   * @param {string} value
   */
  public setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  }
  /**
   * common get item
   * @param {string} key
   */
  public getItem(key: string) {
    return localStorage.getItem(key);
  }
  /**
   * common remove item
   * @param {string} key
   */
  public removeItem(key: string) {
    localStorage.removeItem(key);
  }

  /**
   * set session-token
   * @param {string} value
   */
  public setToken(value: string) {
    this._token = value;
    localStorage.setItem(KEYS.token, value);
  }
  /**
   *  get token
   * @param {string} key
   */
  static get token() {
    return localStorage.getItem(KEYS.token);
  }
  /**
   *  remove token
   * @param {string} key
   */
  public removeToken() {
    localStorage.removeItem(KEYS.token);
    this._token = null;
  }

  /**
   *  set appVersion
   * @param {MsdaAppVersions} versions
   */
  public setAppVersion(versions: MsdaAppVersions) {
    const current = { ...this.versions, ...versions };
    localStorage.setItem(KEYS.appVersions, JSON.stringify(current))
    return this.versions;
  }

  /**
   *  get appVersions
   */
  get appVersions() {
    return this.versions;
  }

  public _setSessionClient(clientId: number | null) {
    return this._httpClient.post<MsdaResponse<any>>(`${this._apiPrefix}/um/v3/user/session/client`, { data: { clientId } });
  }

  /**
   * set orgClientId to storage
   * @param {number} orgClientId
   */
   async setOrgClientId(orgClientId: number | null, setInSession?: boolean) {
    if (setInSession) {
      try {
        await this._setSessionClient(orgClientId).toPromise();
        return { success: this._setOrgClientId(orgClientId) };
      } catch (error) {
        return { success: false, error };
      }
    }
    return { success: this._setOrgClientId(orgClientId) };
  }


  private _setOrgClientId(_orgClientId: number | null) {
    this._orgClientId = _orgClientId;
    if (_orgClientId)
      localStorage.setItem(KEYS.orgClientId, _orgClientId.toString());
    else localStorage.removeItem(KEYS.orgClientId);
    return true;
  }

  private _getOrgClientId() {
    try {
      this._orgClientId = Number(localStorage.getItem(KEYS.orgClientId));
      return this._orgClientId;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  get orgClientId(){
    return this._getOrgClientId();
  }
  //translations

  private async _checkTranslationVersions() {
    this._translationVersions = await this._getRemoteTranslationVersions();
    if (this._translationVersions) {
      const i18n = this._getLocalTranslationVersions();
      if (!Object.keys(i18n).length && this.loadAllTranslations) {
        this._loadAll();
      } else {
        const appsTranslationsToUpdate: AppTranlationVersion = this._getOutDatedAppKeywords(this._translationVersions, i18n);
        const updatedAppTranslations = await this._getTranslations(appsTranslationsToUpdate);
        this._updateInStorage(updatedAppTranslations);
      }
    }
  }

  private async _loadAll() {
    const { result: { data } }: { result: { data: OriginalTranslation[] } } = await this._translationsPromise([])
    const updatedTranslations: MsdaI18n = {};
    const appTranslations: any = {};
    
    data.forEach(tr => {
      tr.applications.forEach(application => {
        if(!appTranslations[application]) appTranslations[application] = [];
        appTranslations[application].push(tr);
      })
    })
    
    Object.keys(appTranslations).forEach(application=>{
      const keywords = this._transformTranslations(appTranslations[application]);
      updatedTranslations[application] = {
        version: this._translationVersions[application] || 1,
        keywords: keywords
      }
    })

    this._updateInStorage(updatedTranslations);
  }
  private async _getRemoteTranslationVersions(): Promise<AppTranlationVersion | null> {
    try {
      const { result: { data } } = await this._httpClient.get<MsdaResponse<AppTranlationVersion>>(`${this._apiPrefix}/translations/versions`).toPromise();
      return data;
    } catch (err) {
      return null;
    }
  }

  private _getLocalTranslationVersions() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.i18n) || '{}');
    } catch (error) {
      console.error(error);
      return {}
    }
  }

  private _getOutDatedAppKeywords(versions: AppTranlationVersion, i18n: MsdaI18n): AppTranlationVersion {
    const outDated: AppTranlationVersion = {};
    if (this.loadAllTranslations) {
      Object.keys(i18n).forEach( abbr =>{
        if(i18n[abbr].version < versions[abbr]){
          outDated[abbr] = versions[abbr]
        }
      })

    } else {
      this.applicationAbbrs.forEach(abbr => {
        if (!i18n[abbr] || i18n[abbr].version < versions[abbr]) {
          outDated[abbr] = versions[abbr]
        }
      });
    }
    return outDated;
  }

  private _translationsPromise(applications: string[]) {
    return this._httpClient.post<MsdaResponse<OriginalTranslation[]>>(`${this._apiPrefix}/translations`, { data: { applications } }).toPromise();
  }

  private async _getTranslations(applications: AppTranlationVersion): Promise<MsdaI18n> {
    const updatedTranslations: MsdaI18n = {};
    await Promise.all(Object.keys(applications).map(async application => {
      try {
        const { result: { data } } = await this._translationsPromise([application])
        const keywords = this._transformTranslations(data);
        updatedTranslations[application] = {
          version: applications[application],
          keywords: keywords
        }
      } catch (err) {
        console.error(err);
      }
    }));
    return updatedTranslations;
  }

  private _transformTranslations(translations: OriginalTranslation[]): Translations {
    const translationObject: Translations = {};

    translations.forEach(translation => {
      translationObject[translation.keyword] = translation.translations;
    })

    return translationObject;
  }

  private _updateInStorage(newData: MsdaI18n) {
    try {
      const oldData = this._getLocalTranslationVersions();
      const toSave = {
        ...oldData,
        ...newData
      }
      localStorage.setItem(KEYS.i18n, JSON.stringify(toSave));
    } catch (err) {
      console.log(err);
    }
  }

  public get translations() {
    return this._getLocalTranslationVersions();
  }


  public get versions() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.appVersions) || '{}')
    } catch (error) {
      console.error(error);
      return {}
    }
  }

  /**
   * set config
   * @param {Config} config  set apiConfig 
   */
  public setConfig(config: Config) {
    this._apiPrefix = config.apiPrefix
  }
}



export interface Config {
  apiPrefix: string;
}
export interface MsdaAppVersions {
  [x: string]: MsdaAppVersionItem
}


export interface MsdaAppVersionItem {
  build: number,
  version: string
}



export interface MsdaResponse<T> {
  result: {
    data: T
  }
}

export interface AppTranlationVersion {
  [x: string]: number;
}

export interface Translations {
  [x: string]: {
    ge: string;
    en: string;
  };
}
export interface MsdaI18n {
  [x: string]: {
    version: number;
    keywords: Translations
  };
}

export interface OriginalTranslation {
  applications: string[];
  keyword: string;
  translations: {
    ge: string;
    en: string;
  }
}
