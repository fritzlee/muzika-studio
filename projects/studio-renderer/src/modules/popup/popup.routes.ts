import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PopupLayoutComponent } from './popup-layout.component';
import { WebPopupComponent } from './components/web/web-popup.component';
import { WalletGeneratorComponent } from './components/wallet-generator/wallet-generator.component';

const routes: Routes = [
  { path: 'web', component: WebPopupComponent },
  { path: 'wallet-generate', component: WalletGeneratorComponent },
];

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        outlet: 'popup',
        component: PopupLayoutComponent,
        children: [...routes]
      },
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class PopupRouteModule {
}
