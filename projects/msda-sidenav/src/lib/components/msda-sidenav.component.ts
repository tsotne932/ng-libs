import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { MsdaSidenavModule } from '../msda-sidenav.module';
import { SideNavService } from '../service/sidenav.service';
import { SelectClientComponent } from './select-client/select-client.component';

interface Application {
  abbreviation: string;
  id: number;
  name: string;
  nameEn: string;
  description: string;
  meta: any;
  img: string;
  url: string;
  disabled: boolean;
  setHrPosition: boolean;
}
enum UserType {
  private = 'private',
  public = 'public'
}

@Component({
  selector: 'msda-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class MsdaSidenavComponent implements OnInit {
  imagesSourceUrl: string = '';
  userType: UserType = UserType.public;
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
  selectedClientId = null;
  subscription!: Subscription;

  links: any = {};
  @Input() set isPrivate(val: boolean) {
    this._isPrivate = val;
    MsdaSidenavModule.isPrivate = this._isPrivate;
    if (this._isPrivate) this.userType = UserType.private;
    else this.userType = UserType.public;

    if (this._isPrivate && this.clientId) {
      this.getStarted()
    }
  }
  _user: any;
  @Input() set user(user: any) {
    this._user = user;
    if (user && user.userType == 'EMPLOYEE') {
      this.userType = UserType.private;
      if (user.selected.clientId) this.selectedClientId = user.selected.clientId;
      for (const [id, item] of Object.entries(user.clients)) {
        const client = item as any;
        Object.keys(client.applications || {}).forEach(key => {
          this.userApps[key] = true;
          client.id = +id;
          if (!this.userAppClients[key]) this.userAppClients[key] = {};
          this.userAppClients[key][client.id] = client;
        })
      }
    }

    this.loadApps();
  }
  _clientId!: number;
  @Input()
  set clientId(value: number) {
    this._clientId = value;
    if (!this.isPrivate)
      this.getStarted();
  };


  get clientId() {
    return this._clientId;
  }

  get user() {
    return this.user;
  }

  private _isPrivate: boolean | undefined;
  constructor(private _sideNav: SideNavService, private _dialog: MatDialog) {
    this.imagesSourceUrl = MsdaSidenavModule.imagesSourceUrl;
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }


  async ngOnInit() {
    ///თუ clientId  არსებობს, ესეიგი ეს მეთოდი უკვე გაეშვა ზემოთ
    if (!this.clientId && !this.isPrivate) {

      await this.getStarted();
    }

  }

  async getStarted() {
    await this._sideNav.loadApps(!this.isPrivate ? this.clientId : '');
    this.loadApps();
  }

  _setPrivate() {
    this.userType = UserType.private;
  }

  _setPublic() {
    this.userType = UserType.public;
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
          if (app.metaJson.imgUrl) app.img = app.metaJson.imgUrl;
          if (app.metaJson[this.userType] && app.metaJson[this.userType].url) app.url = app.metaJson[this.userType].url;
          if (app.metaJson[this.userType] && app.metaJson[this.userType].name) app.name = app.metaJson[this.userType].name;
          if (app.metaJson[this.userType] && app.metaJson[this.userType].nameEn) app.nameEn = app.metaJson[this.userType].nameEn;
          if (app.metaJson[this.userType]) app.setHrPosition = app.metaJson[this.userType].setHrPosition || false;
          if (app.metaJson[this.userType]) app.orderPriority = app.metaJson[this.userType].orderPriority || 1000;
        }
        if (this.isPrivate) {
          app.disabled = !this.userApps[app.abbreviation];

        }

      } catch (err) {
        console.log(err);
      }
      return app;
    })
    this.applications[UserType.private] = apps.filter(app => app.metaJson && this.applicationTypes[UserType.private].indexOf(app.type) > -1 && app.metaJson[UserType.private] && !app.metaJson[UserType.private].hidden).sort((a, b) => a.orderPriority - b.orderPriority)
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


  _goPrivate(item: Application) {

    if (this.userAppClients[item.abbreviation]) {
      const keys = Object.keys(this.userAppClients[item.abbreviation]);
      if (keys.length == 1 && keys[0] == this.selectedClientId && !item.setHrPosition) {

        this._navigate(item.url, this.selectedClientId || undefined, item.id);
      }
      else {
        this._dialog.open(SelectClientComponent, {
          width: '761px',
          // height: '252px',
          panelClass: 'select-client',
          data: {
            clients: [...Object.values(this.userAppClients[item.abbreviation])],
            setHrPosition: item.setHrPosition
          }
        }).afterClosed().subscribe((clientId: any) => {
          if (clientId) {
            this._navigate(item.url, clientId || undefined, item.id);
          }
        })
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
    this._navigate(item.url, this.clientId)
  }

  _navigate(url: string, clientId?: number, applicationId?: number) {
    if (clientId)
      url = url.replace('${clientId}', clientId.toString())
    if (applicationId)
      url = url.replace('${applicationId}', applicationId.toString());
    this.navigate(url)
  }

  public navigate(loc: string): void {
    const token = this.isPrivate ? localStorage.getItem('private-token') : localStorage.getItem('public-token');
    // loc = this._tranformByEnv(loc);
    if (loc.includes('${token}')) {
      loc = loc.replace('${token}', token || '');
      location.href = loc;
    } else location.href = `${loc}?token=${token}`
  }


  get isPrivate() {
    if (this._isPrivate !== undefined) return this._isPrivate;
    else if (MsdaSidenavModule.isPrivate !== undefined) return MsdaSidenavModule.isPrivate;
    else return this.userType == UserType.private;
  }

  get lang() {
    return localStorage.getItem('msda-lang');
  }

  backButtonClick(key: string) {
    this.navigate(this.links[key][MsdaSidenavModule.env]);
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
