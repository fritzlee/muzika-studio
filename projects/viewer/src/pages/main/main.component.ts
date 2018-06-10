import {select} from '@angular-redux/store';
import {Component} from '@angular/core';
import {BaseComponent, CommunityPost, ExtendedWeb3, MuzikaCoin, MusicPost, unitUp, User} from '@muzika/core';
import {Observable, combineLatest, from} from 'rxjs';
import {BestPostsMock, MusicPostsMock} from '../../mock/posts';
import {Router} from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainPageComponent extends BaseComponent {
  musics: MusicPost[] = MusicPostsMock.slice(0, 5);
  posts: CommunityPost[] = BestPostsMock;

  topMusics: MusicPost[];

  @select(['user', 'currentUser'])
  currentUserObs: Observable<User>;
  currentUser: User;
  balances: {
    mzk: number | string;
    dollar: number | string;
  };

  constructor(private muzikaCoin: MuzikaCoin,
              private router: Router,
              private web3: ExtendedWeb3) {
    super();
    this.topMusics = this.musics.slice(0, 3);
    this.balances = <any>{};
  }

  ngOnInit() {
    this.muzikaCoin.deployed();

    this.router.navigateByUrl('/board/music/write');

    this._sub.push(
      combineLatest(
        from(this.muzikaCoin.deployed()),
        this.currentUserObs
      ).subscribe(async ([coin, user]) => {
        console.log('33', user);
        if (user) {
          const rawBalance = await coin.balanceOf(user.address);
          this.balances = {
            mzk: unitUp(rawBalance),
            // @TODO deploy muzika loyalty point
            dollar: 0
          };
        }
      })
    );
  }
}
