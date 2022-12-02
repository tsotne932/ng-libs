import { AfterContentChecked, AfterContentInit, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MsdaStorage } from 'msda-storage';
import { Subscription } from 'rxjs';
import { MsdaSidenavModule } from '../msda-sidenav.module';
import { SideNavService } from '../service/sidenav.service';

interface Application {
  abbreviation: string;
  id: number;
  name: string;
  nameEn: string;
  description: string;
  meta: any;
  imgUrl: string;
  url: string;
  disabled: boolean;
  setHrPosition: boolean;
  domainType: 'multi' | 'single';
}
enum UserType {
  private = 'private',
  public = 'public'
}

function isSelectClientDialogScriptLoaded(url:string) {

  var scripts = document.getElementsByTagName('script');
  for (var i = scripts.length; i--;) {
      if (scripts[i].src == url) return true;
  }
  return false;
}
const selectClientScripts = 'https://static.msda.ge/select-client-dialog/v1.1/main.js';
const SUPER_POSITION_PERMISSION = 'CHA.ACCESS_WITHOUT_POSITION';

@Component({
  selector: 'msda-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class MsdaSidenavComponent implements OnInit {
  imagesSourceUrl: string = '';

  get userType(): UserType {
    if (this._user && this._user.userType == 'EMPLOYEE')
      return UserType.private;
    else if (this.isPrivate) return UserType.private
    else return UserType.public;
  }

  applications: {
    private: Application[],
    public: Application[]
  } = {
      private: [],
      public: []
    }
  userApps: any = {};
  userAppClients: any = {};
  applicationTypes: any = {
    private: ['PRIVATE', 'MULTI'],
    public: ['PUBLIC', 'MULTI']
  }
  _selectedClientId: number | null = null;
  subscription!: Subscription;

  links: any = {};
  @Input() isPrivate: boolean = false;

  _user: any;
  @Input() set user(user: any) {
    this._user = user;
    if (user && user.userType == 'EMPLOYEE') {
      if (user.selected.clientId) this._storage.setClientId(user.selected.clientId);
      for (const [id, item] of Object.entries(user.clients)) {
        const client = item as any;
        Object.keys(client.applications || {}).forEach(key => {
          this.userApps[key] = true;
          client.id = +id;
          if (!this.userAppClients[key]) this.userAppClients[key] = {};
          this.userAppClients[key][client.id] = client;
        })
       
        if((client.permissions || []).includes(SUPER_POSITION_PERMISSION)){
          this.clientSuperPositions.push(client.id)
        }
      }
    }

    this.getStarted();
  }

  get selectedClientId(){
    return this._storage.clientId || this._user?.selected?.clientId;
  }

  get clientId() {
    return this._storage.clientId;
  }

  get user() {
    return this.user;
  }

  position: any;
  clientPosition: any = {};
  clientSuperPositions: number[] = [];

  constructor(private _sideNav: SideNavService, private _dialog: MatDialog, private _storage: MsdaStorage) {
    this.imagesSourceUrl = MsdaSidenavModule.imagesSourceUrl;
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }


  async ngOnInit() {
    if (!this.clientId && !this.isPrivate) {
      await this.getStarted();
    }

    if (this.isPrivate) {
      await this.getPosition();
    }

    
    let scd = document.getElementById('scd-root');
    if(!scd) {
      const a = document.createElement('div');
      a.setAttribute("id", 'scd-root');
      document.body.appendChild(a);
    };

    if(!isSelectClientDialogScriptLoaded(selectClientScripts)){
     try{
      const script = document.createElement('script');
      script.setAttribute(
        'src',
        selectClientScripts,
      );
      script.setAttribute('defer', '');
      document.head.appendChild(script);
     } catch(er){
      console.log(er)
     }
    }

   

  }

  async getPosition() {
    this.position = await this._sideNav.currentStatusNewOfEmployee().toPromise();
    if (this.position) {
      this.position.forEach((info: any) => {
        if (!this.clientPosition[info.employee.clientId]) this.clientPosition[info.employee.clientId] = [info]
        else this.clientPosition[info.employee.clientId].push(info);
      })
    }
  }

  async getStarted() {
    await this._sideNav.loadApps(!this.isPrivate ? this.clientId : '');
    this.loadApps();
  }

  async loadApps() {
    let apps = [...this._sideNav.applications];
    if (this._sideNav.links)
      this.links = this._sideNav.links;
    if (MsdaSidenavModule.currentAppAbbreviation)
      apps = apps.filter(app => app.abbreviation !== MsdaSidenavModule.currentAppAbbreviation);
    apps = apps.map(app => {
      try {
        if (app.meta) {
          app.metaJson = JSON.parse(app.meta);
          if (app.metaJson[this.userType] && app.metaJson[this.userType].imgUrl) app.imgUrl = app.metaJson[this.userType].imgUrl;
          if (app.metaJson[this.userType] && app.metaJson[this.userType].url) app.url = app.metaJson[this.userType].url;
          if (app.metaJson[this.userType] && app.metaJson[this.userType].name) app.name = app.metaJson[this.userType].name;
          if (app.metaJson[this.userType] && app.metaJson[this.userType].nameEn) app.nameEn = app.metaJson[this.userType].nameEn;
          if (app.metaJson[this.userType]) app.setHrPosition = app.metaJson[this.userType].setHrPosition || false;
          if (app.metaJson[this.userType]) app.orderPriority = app.metaJson[this.userType].orderPriority || 1000;
          if (app.metaJson[this.userType]) app.domainType = app.metaJson[this.userType].domainType || 'single';

          if(app.metaJson[this.userType] && app.metaJson[this.userType].shouldHideInsteadDisabled) app.shouldHideInsteadDisabled = true;
        }

        app.disabled =  (this.isPrivate && !this.userApps[app.abbreviation]);

      } catch (err) {
        console.log(err);
      }
      return app;
    })
    this.applications[UserType.private] = apps.filter(app => app.metaJson && this.applicationTypes[UserType.private].indexOf(app.type) > -1 && app.metaJson[UserType.private] && !app.metaJson[UserType.private].hidden).filter(app => !app.metaJson[UserType.private].shouldHideInsteadDisabled || (app.metaJson[UserType.private].shouldHideInsteadDisabled &&  this.userApps[app.abbreviation])).sort((a, b) => a.orderPriority - b.orderPriority)
    this.applications[UserType.public] = apps.filter(app => app.metaJson && this.applicationTypes[UserType.public].indexOf(app.type) > -1 && app.metaJson[UserType.public] && !app.metaJson[UserType.public].hidden).sort((a, b) => a.orderPriority - b.orderPriority)

  }

  close() {
    this._sideNav.close();
  }

  async go(item: Application) {
    if (item.disabled || !item.url) return;
    if (this.userType == UserType.private) await this._goPrivate(item);
    else this._goPublic(item);
  }

  // super_position
  // ერთი თანამდებობა თუ აქვს მხოლოდ მაშნ ეგრევე ვუშებ 
  private async _checkHRPositions(item: Application, clientId: number) {
    if (item.setHrPosition) { //თუ საჭიროა HR 
      
      if(item.abbreviation == 'CHA' && !this.clientPosition[clientId] && this.clientSuperPositions.includes(clientId)) { //თუ დანიშვნა არ მაქვს ამ კლიენტში მაგრამ super_position მაქვს აქვე
          await this._sideNav.setSessionClient(clientId).toPromise();
          this._navigate(item.url, clientId || undefined, item.id, item.domainType);
      } else if(!this.clientPosition[clientId] || !this.clientPosition[clientId].length) { // თუ თანამდებობდა არაა ამ კლიენტში 
        this._openDialog(item, clientId);
      } else if (this.clientPosition[clientId].length > 1) { // თუ ამ კლიენტში ერთზე მეტი თანამდებობა მაქვს
        this._openDialog(item, clientId);
      } else { // თუ ამ კლიენტში ერთი თანამდებობა მაქვს 
          await this._sideNav.setSessionClient(clientId).toPromise();
          await this._sideNav.changeSelectedPosition(this.clientPosition[clientId][0]).toPromise();
          this._navigate(item.url, clientId || undefined, item.id, item.domainType);
      }
    } else { // თუ HR არ სჭირდება 
      await this._sideNav.setSessionClient(clientId).toPromise();
      this._navigate(item.url, clientId || undefined, item.id, item.domainType);
    }
  } 

  _goPrivate(item: Application) {
    debugger
    if (!this.selectedClientId) {
      return;
    } else if (this.userAppClients[item.abbreviation]) {

      let filteredUserAppClients = new Set(Object.keys(this.userAppClients[item.abbreviation]).map(c=>Number(c)));
      if(item.setHrPosition) {
        let toSet =  Object.keys(this.clientPosition).map(c=>Number(c))
         if(item.abbreviation == 'CHA') toSet =  [...Object.keys(this.clientPosition).map(c=>Number(c)), ...this.clientSuperPositions]
         toSet = toSet.filter(i=>this.userAppClients[item.abbreviation][i]);
         filteredUserAppClients = new Set(toSet);
      }
      if (filteredUserAppClients.has(this.selectedClientId)) { // რომელი კლიენტიც არჩეული მაქვს იქ ჩართულია ეს აპლიკაცია
        this._checkHRPositions(item, this.selectedClientId);
      } else if (filteredUserAppClients.size == 1) {// რომელი კლიენტიც არჩეული მაქვს იქ ჩართულია არაა ეს აპლიკაცია, და სხვა მხოლოდ ერთ კლიენტში მაქვს ჩართული
        this._checkHRPositions(item, Array.from(filteredUserAppClients)[0]);
      } else { // რომელი კლიენტიც არჩეული მაქვს იქ ჩართულია არაა ეს აპლიკაცია და სხვა რამდენიმე კლიენტშია ჩართული ეს აპლიკაცია
        this._openDialog(item);
      }
    }
  }

  _openDialog(item: Application, selectedClientId?:number){
    // @ts-ignore
    window.showSelectClientDialog(
      item.abbreviation, //application keyword abbreviation
      MsdaStorage.token, //session-token from Local Storage or Session Object
      MsdaSidenavModule.publicApi, //public-api address, example: public-api
      !item.setHrPosition, //true is Position is not aplicable for current project, otherwise false
      selectedClientId, //priority ClientId if necessary
      true
    );
    
     //@ts-ignore
     window.onSelectClient = (clientId :number, selectedPosition:any) => {
      console.log(clientId, "client")
      console.log(selectedPosition, "client")
         if (clientId) {
          this._navigate(item.url, clientId || undefined, item.id, item.domainType);
      }
    }
  }

  _goPublic(item: Application) {
    if (item.url) {
      if (!item.url.includes('?')) {
        item.url = `${item.url}?clientId=` + this.clientId;
      } else if (!item.url.includes('${clientId}')) {
        item.url = `${item.url}&clientId=` + '${clientId}';
      }
    }
    
    this._navigate(item.url, this.clientId, undefined, item.domainType)
  }

  _navigate(url: string, clientId?: number | null, applicationId?: number, domainType?: string) {
    if (clientId)
      url = url.replace('${clientId}', clientId.toString())
    if (applicationId)
      url = url.replace('${applicationId}', applicationId.toString());
    this.navigate(url, domainType)
  }

  public navigate(loc: string, domainType?: string): void {
    const token = MsdaStorage.token;
    // loc = this._tranformByEnv(loc);
    if(domainType && domainType == 'multi'){
      if (loc.includes('${token}')) {
        loc = loc.replace('${token}', token || '');
      } else loc = `${loc}?token=${token}`
    }

    location.href = loc;
  }


  // get isPrivate() {
  //   if (this._isPrivate !== undefined) return this._isPrivate;
  //   else if (MsdaSidenavModule.isPrivate !== undefined) return MsdaSidenavModule.isPrivate;
  //   else return this.userType == UserType.private;
  // }

  get lang() {
    return MsdaStorage.lang
  }

  backButtonClick(key: string) {
    this.navigate(this.links[key][MsdaSidenavModule.env], undefined);
  }

  get logo() {
    return `${this.imagesSourceUrl}/assets/imgs/logos/msda-logo-blue-${this.lang || 'ge'}.svg`
  }
  get isLendingPage() {
    return MsdaSidenavModule.currentAppAbbreviation == 'LENDING';
  }
  get isAppsLendingPage() {
    return MsdaSidenavModule.currentAppAbbreviation == 'APPS_LENDING';
  }

}
