import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './tabs.router.module';

import { TabsPageComponent } from './tabs.page';
import { SettingsPageModule } from '../settings/settings.module';
import { AboutPageModule } from '../about/about.module';
import { HomePageModule } from '../home/home.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    HomePageModule,
    AboutPageModule,
    SettingsPageModule
  ],
  declarations: [TabsPageComponent]
})
export class TabsPageModule {}
