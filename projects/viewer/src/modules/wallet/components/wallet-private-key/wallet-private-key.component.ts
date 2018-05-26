import {Component} from '@angular/core';
import {NgForm} from '@angular/forms';
import {BaseComponent, AlertifyInstnace, MuzikaWeb3Service, UserActions} from '@muzika/core';

@Component({
  selector: 'wallet-private-key-selector',
  templateUrl: './wallet-private-key.component.html'
})
export class WalletPrivateKeyComponent extends BaseComponent {
  constructor(private web3Service: MuzikaWeb3Service,
              private userActions: UserActions) {
    super();
  }

  usingPrivateKey(form: NgForm) {
    if (form.valid && form.value.privKey) {
      return this.web3Service
        .usingPrivateKey(form.value.privKey)
        .subscribe(accounts => {
          this.userActions.login(accounts[0]).subscribe(user => {
            console.log(user);
          });
        });
    } else {
      AlertifyInstnace.alert('개인키가 올바르지 않습니다');
      return null;
    }
  }
}
