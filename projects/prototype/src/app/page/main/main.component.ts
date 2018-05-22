import {Component} from '@angular/core';
import {BaseComponent, Artist, FreePost, SheetMusic} from '@muzika/core';
import * as _alertify from 'alertify.js';
import {ArtistsMock} from '../../mock/artists';
import {PostsMock} from '../../mock/posts';
import {SheetsMock} from '../../mock/sheets';

const alertify = _alertify.okBtn('확인').cancelBtn('취소');

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainPageComponent extends BaseComponent {
  artists: Artist[] = ArtistsMock;
  sheets: SheetMusic[] = SheetsMock;
  posts: FreePost[] = PostsMock;

  topSheets: SheetMusic[];

  constructor() {
    super();
    this.topSheets = this.sheets.slice(0, 3);
  }
}
