# MsdaStorage

## install
```sh
npm i msda-storage --save
```

> #### Storage   Overview
>
> - session-token
> - clientId (*only for public project)
> - lang
> - i18n (translations)
>
## Add to project

```javascript
import { MsdaStorageModule, MsdaStorage } from 'msda-storage';

function initApp( storage: MsdaStorage) {
  return async () => {
    /**
     * @param{appKeyWords}  იმ აპლიკაციების keyword-ები რომლის translate-ებსაც იყენებს აპლიკაცია
     */
    const appKeyWords = ['USER_MANAGEMENT'];
    await storage.loadTranslations(appKeyWords);
    return;
  };
}

@NgModule({
  declarations: [
   ...
  ],
  imports: [
    ...
    MsdaStorageModule
  ],
  providers: [
    ...
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      multi: true,
      deps: [MsdaStorage],
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

```

## Usage of Storage

#### ClientId - note: only in public projects
```javascript
    this._storage.setClientId(41, setSessionClient) //set setSessionClient = true | false , default = false
    this._storage.clientId //get
```
#### Lang 
```javascript
    this._storage.setLang('en') //set
    this._storage.lang //get
```
#### SessionToken 
```javascript
    this._storage.setToken('tokenString') //set
    MsdaStorage.token //get
```
#### Custom Items 
```javascript
    this._storage.setItem('someKey', "someItem"); //set
    this._storage.getItem('someKey'); //get
```
#### Translations 
```javascript
    this._storage.translations; //get
````

#### AppVersions 
```javascript
    this._storage.setAppVersion(MsdaAppVersions); //set
    this._storage.appVersions; //get
    
    //set example
    this._storage.setAppVersion({
        "sso": {
            "build":4,
            "version":"0.0.1"
        }
    });
````
