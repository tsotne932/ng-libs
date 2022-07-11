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
        if (this.selected) {
          await this.service.setSessionClient(this.selected).toPromise();
          this.dialogRef.close(this.selected);
        }
      },
      disabled: (form: FormGroup) => {
        return form.invalid;
      }
    },
    {
      label: 'გასვლა',
      color: 'primary',
      raised: false,
      show: this.showLogoutBtn,
      click: async (form: FormGroup) => {
        await this.service.logout().toPromise();
        this.closeDialog();
      },
      disabled: () => false
    }
  ]

  constructor(public dialogRef: MatDialogRef<SelectClientComponent>, private service: SideNavService, @Inject(MAT_DIALOG_DATA) data: { clients: any[] }) {
    this.clients = data.clients || [];
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    const selectedClientId = this.clients.length ? this.clients[0].id : null;
    if (!selectedClientId) this.showLogoutBtn = true;

    this.form = new FormGroup({
      client: new FormControl(selectedClientId)
    })
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
