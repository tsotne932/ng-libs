import { ComponentType } from "@angular/cdk/portal";
import { HttpClient } from "@angular/common/http";
import { Injectable, ViewContainerRef, ComponentFactoryResolver } from "@angular/core";
import { MatSidenav } from "@angular/material/sidenav";
import { BehaviorSubject, Observable } from "rxjs";
import { delay, finalize, map } from "rxjs/operators";
import { MsdaSidenavModule } from "../msda-sidenav.module";

@Injectable(
  {
    providedIn: 'root'
  }
)
export class SideNavService {
  applications: any[] = [];

  private _opened: BehaviorSubject<any> = new BehaviorSubject(false);

  readonly opened: Observable<boolean> = this._opened.asObservable();

  constructor(private _http: HttpClient) {

  }

  async loadApps() {
    try {
      const { result: { data } } = await this._http.get<{ result: { data: any } }>(`/api/um/v3/applications/all`).toPromise();
      this.applications = data;
    } catch (err) {
    }
  }

  setSessionClient(clientId?: number) {
    return this._http.post<{ result: { data: any } }>(`/api/um/v3/user/session/client`, { data: { clientId } }).pipe(map(res => {
      if (res.result) {
        return res.result.data;
      } return {};
    }));
  }

  logout() {
    return this._http.delete<{ status: number }>('/api/v3/session').pipe(
      finalize(() => {
        localStorage.removeItem(MsdaSidenavModule.isPrivate ? 'private-token' : 'public-token');
      })
    );
  }

  open() {
    this._opened.next(true);
  }

  close() {
    this._opened.next(false);
  }
}
