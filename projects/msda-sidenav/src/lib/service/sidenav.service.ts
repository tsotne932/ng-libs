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
  links: any = {};

  private _opened: BehaviorSubject<any> = new BehaviorSubject(false);

  readonly opened: Observable<boolean> = this._opened.asObservable();

  constructor(private _http: HttpClient) {

  }

  async loadApps(clientId: any = '') {
    try {
      const { result: { data } } = await this._http.get<{ result: { data: any } }>(`${MsdaSidenavModule.publicApiPreffix}/um/v3/applications/byClientId?clientId=${clientId}`).toPromise();
      if (data) {
        this.applications = data.apps;
        this.links = data.links;
      }
    } catch (err) {
    }
  }

  setSessionClient(clientId?: number) {
    return this._http.post<{ result: { data: any } }>(`${MsdaSidenavModule.publicApiPreffix}/um/v3/user/session/client`, { data: { clientId } }).pipe(map(res => {
      if (res.result) {
        return res.result.data;
      } return {};
    }));
  }

  logout() {
    return this._http.delete<{ status: number }>(`${MsdaSidenavModule.publicApiPreffix}/v3/session`).pipe(
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

  setHrPosition(position: any) {
    return this._http.post<{ result: { data: any } }>(`${MsdaSidenavModule.publicApiPreffix}/um/v3/user/hr/position`, { data: { position } }).pipe(map(res => {
      if (res.result) {
        return res.result.data;
      } return {};
    }));
  }


  changeSelectedPosition(selectedPosition: any): Observable<any> {
    const data = {
      position: {
        employeeState: selectedPosition.unitGraph,
        actionTypeId: selectedPosition.actionTypeId,
        organizationId: selectedPosition.organizationId,
        organizationName: selectedPosition.organizationName,
        positionName: selectedPosition.positionName,
        hierarchyArr: selectedPosition.hierarchyArr,
      },
    };
    return this._http
      .put<any>(`${MsdaSidenavModule.publicApiPreffix}/v3/session/position`, { data: data })
      .pipe(map(({ data }: { data: unknown }) => data));
  }

  public currentStatusNewOfEmployee(): Observable<any> {
    return this._http
      .post<any>(`${MsdaSidenavModule.publicApiPreffix}/hr/employee/commission/search`, {})
      .pipe(
        map((response: any) => {
          if (!response || !response.result || !response.result.data) return [];
          const currResponseObj = response.result.data;
          const ans: any[] = []; //აქ იწერება ამოღებული ინფორმაცია იერარქიის გათვალისწინებთ

          function arrayToTreeForPositions(nodes: any, id: any) {
            const map: any = {},
              tree = [];
            let node;
            for (let i = 0, l = nodes.length; i < l; i++) {
              node = nodes[i];
              node['children'] = [];
              map[node.id] = i;
            }
            for (let i = 0, l = nodes.length; i < l; i++) {
              node = nodes[i];
              if (node.id != id && nodes[map[node.parentUnitId]]) {
                nodes[map[node.parentUnitId]]['children'].push(node);
                nodes[map[node.parentUnitId]]['children'].sort(function (a: any, b: any) {
                  return a.orderNumber - b.orderNumber;
                });
              } else {
                tree.push(node);
              }
            }
            return tree;
          }

          let fullHierarchy = ''; //იეარქიის სტრინგი

          function hierarchy(current: any) {
            if (current.children.length) {
              for (let i = 0, l = current.children.length; i < l; i++) {
                if (current.children[i].unitTypeId != 3) {
                  fullHierarchy += current.children[i].name + ' - ';
                  ans.push(current.children[i]);
                }
                hierarchy(current.children[i]);
              }
            } else {
              return ans;
            }
            return ans;
          }


          const newArr = [];

          if (currResponseObj && currResponseObj.commissionInfo) {
            for (let i = 0, l = currResponseObj.commissionInfo.length; i < l; i++) {
              const commissionObj = currResponseObj.commissionInfo[i];
              const baseRootUnit = commissionObj.unitHierarchy.find((e: any) => e.unitTypeId == 1 || e.unitTypeId == 0);

              const hrTreeRoot = commissionObj.unitHierarchy.find((e: any) => e.isRoot);
              let ans = [];
              fullHierarchy = '';
              const hierarchyArr = JSON.parse(JSON.stringify(commissionObj.unitHierarchy));
              const unitTree = arrayToTreeForPositions(hierarchyArr, baseRootUnit.id);
              ans = [];
              ans.push(unitTree[0]);
              hierarchy(unitTree[0]);
              commissionObj.unit.unitStats = commissionObj.unitStats;
              commissionObj.unit.suspension = commissionObj.suspension;
              newArr.push({
                id: commissionObj.unit.id,
                unitGraph: commissionObj.unit,
                positionName: baseRootUnit.name + ' - ' + fullHierarchy + commissionObj.unit.name,
                reasonId: commissionObj.contract ? commissionObj.contract.subTypeId : 0,
                signatureFileId: currResponseObj.signatureFileId,
                organizationId: baseRootUnit.id,
                hrTreeRootId: hrTreeRoot.id,
                name: currResponseObj.firstName + ' ' + currResponseObj.lastName,
                regaliaList: commissionObj.regaliaList,
                employee: {
                  id: currResponseObj.id,
                  firstName: currResponseObj.firstName,
                  lastName: currResponseObj.lastName,
                  fatherName: currResponseObj.fatherName,
                  pid: currResponseObj.pid,
                  gender: currResponseObj.gender,
                  citizenship: currResponseObj.citizenship,
                  birthDate: currResponseObj.birthDate,
                  isDead: currResponseObj.isDead,
                  birthPlace: currResponseObj.birthPlace,
                  livingPlace: currResponseObj.livingPlace,
                  region: currResponseObj.region,
                  contactId: currResponseObj.contactId,
                  signatureFileId: currResponseObj.signatureFileId,
                  clientId: commissionObj.unit?.clientId,
                },
                originalEmployee: {
                  firstName: commissionObj.unit.originalEmployeeFirstName,
                  lastName: commissionObj.unit.originalEmployeeLastName,
                  pid: commissionObj.unit.originalEmployeePid,
                },
                actionTypeId: commissionObj.actionTypeId,
                organizationName: baseRootUnit.name,
                hierarchyArr: commissionObj.unitHierarchy,
                suspension: commissionObj.suspension,
                contract: commissionObj.contract,
                executorsList: commissionObj.executorsList || [],
              });
            }
          }
          return newArr;
        })
      );
  }


}
