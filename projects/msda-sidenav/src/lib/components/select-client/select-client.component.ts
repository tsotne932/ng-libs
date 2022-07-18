import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SideNavService } from '../../service/sidenav.service';


@Component({
  selector: 'app-select-client',
  templateUrl: './select-client.component.html',
  styleUrls: ['./select-client.component.scss']
})
export class SelectClientComponent implements OnInit {
  title!: string;

  clients: any[] = [];
  selected: any = null;
  showLogoutBtn = false;
  form!: FormGroup;
  actions = [
    {
      label: 'გაგრძელება',
      color: 'primary',
      raised: true,
      click: async (form: FormGroup) => {
        this.selected = form.get('client')?.value;
        try {
          if (this.selected) {
            await this.service.setSessionClient(this.selected).toPromise();
          }
          const selectedPosition = form.get('position')?.value;

          if (selectedPosition) {
            await this.service.changeSelectedPosition(selectedPosition).toPromise();
          }
          this.dialogRef.close(this.selected);

        } catch (err) {
          console.log(err)
        }


      },
      disabled: (form: FormGroup) => {
        return form.invalid;
      }
    },
    {
      label: 'დახურვა',
      color: 'primary',
      raised: false,
      show: this.showLogoutBtn,
      click: async (form: FormGroup) => {
        this.closeDialog();
      },
      disabled: () => false
    }
  ]

  setHrPosition: boolean = false;
  position: any;
  clientPosition: any = {};
  constructor(public dialogRef: MatDialogRef<SelectClientComponent>, private service: SideNavService, @Inject(MAT_DIALOG_DATA) data: { clients: any[], setHrPosition: boolean }) {
    this.clients = data.clients || [];
    this.setHrPosition = data.setHrPosition || false;
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    const selectedClientId = this.clients.length ? this.clients[0].id : null;
    if (!selectedClientId) this.showLogoutBtn = true;

    this.form = new FormGroup({
      client: new FormControl(selectedClientId),
      position: new FormControl()
    })

    if (this.setHrPosition) {
      this.getPosition();
    }

  }

  async getPosition() {
    this.position = await this.service.currentStatusNewOfEmployee().toPromise();
    if (this.position) {
      this.position.forEach((info: any) => {
        if (!this.clientPosition[info.employee.clientId]) this.clientPosition[info.employee.clientId] = [info]
        else this.clientPosition[info.employee.clientId].push(info);
      })
    }
    this.form.get('position')?.setValue(this.position ? this.position[0] : null)
  }

  closeDialog() {
    this.dialogRef.close();
  }

  get clientId() {
    return this.form.get('client')?.value
  }
}
