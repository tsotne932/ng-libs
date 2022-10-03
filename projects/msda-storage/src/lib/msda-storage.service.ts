import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsdaStorageModule } from './msda-storage.module';
import { MsdaAppVersions, MsdaAppVersionService } from './MsdaAppVersion.service';
import { MsdaResponse, MsdaStorageTranslations } from './MsdaStorageTranslations.service';


@Injectable({
  providedIn: 'root'
})
export class MsdaStorage {
  private _clientId?: number | null;
  private _lang: string = 'ge';
  private _token?: string | null = '';

  constructor(private _translations: MsdaStorageTranslations, private _appVersionService:MsdaAppVersionService, private _httpClient: HttpClient) { }

  /**
   * Load Translations with App abbreviations
   * @param {String} appKeywords[]
   */
  async loadTranslations(appKeywords: string[]) {
    if(appKeywords && appKeywords.length)
      this._translations.loadTranslations(appKeywords);
  }

  get translations() {
    return this._translations.translations;
  }

  /**
   * set clientId to storage
   * @param {number} clientId
   */
  async setClientId(clientId: number | null, setInSession?: boolean) {
    if(setInSession){
      try {
        await this._setSessionClient(clientId).toPromise();
        return { success: this._setClientId(clientId) };
      } catch (error: any) {
        return { success: false, error };
      }
    }
    return {success: this._setClientId(clientId)};
  }

  get clientId() {
    return this._getClientId();
  }

  public removeClientId(){
    this.setClientId(null);
  }

  private _setClientId(clientId: number | null) {
    this._clientId = clientId;
    if(clientId)
      localStorage.setItem(MsdaStorageModule.keys.clientId, clientId.toString());
      else localStorage.removeItem(MsdaStorageModule.keys.clientId);
    return true;
  }

  private _getClientId() {
    try {
      this._clientId = Number(localStorage.getItem(MsdaStorageModule.keys.clientId));
      return this._clientId;
    } catch (error) {
      console.error(error);
      return null;
    }
  }


  /**
   * set clientId to storage
   * @param {string} lang
   */
  setLang(lang: string) {
    this._lang = lang;
    this._setLang(lang);
  }
  /**
   *  get lang
   */
  get lang() {
    return this._getLang() || this._lang;
  }

  private _setLang(lang: string | null) {
    if(lang)
      localStorage.setItem(MsdaStorageModule.keys.lang, lang);
    else localStorage.removeItem(MsdaStorageModule.keys.lang);
  }

  private _getLang() {
    return localStorage.getItem(MsdaStorageModule.keys.lang);
  }

  /**
   * common set item
   * @param {string} key
   * @param {string} value
   */
   public setItem(key:string, value:string) {
    localStorage.setItem(key, value);
  }
  /**
   * common get item
   * @param {string} key
   */
  public getItem(key:string) {
   return localStorage.getItem(key);
  }
  /**
   * common remove item
   * @param {string} key
   */
  public removeItem(key:string) {
    localStorage.removeItem(key);
  }

  /**
   * set session-token
   * @param {string} value
   */
   public setToken(value: string) {
    this._token = value;
    localStorage.setItem(MsdaStorageModule.keys.token, value);
  }
  /**
   *  get token
   * @param {string} key
   */
  static get token() {
   return localStorage.getItem(MsdaStorageModule.keys.token);
  }
  /**
   *  remove token
   * @param {string} key
   */
  public removeToken() {
    localStorage.removeItem(MsdaStorageModule.keys.token);
    this._token = null;
  }

  /**
   *  set appVersion
   * @param {MsdaAppVersions} versions
   */
  public setAppVersion(versions: MsdaAppVersions){
    return this._appVersionService.setAppVersion(versions);
  }

  /**
   *  get appVersions
   */
  get appVersions() {
    return this._appVersionService.versions;
  }

  public  _setSessionClient(clientId: number | null)  {
    return this._httpClient.post<MsdaResponse<any>>(`${MsdaStorageModule.prefix}/um/v3/user/session/client`, { data: { clientId  } });
  }



}
