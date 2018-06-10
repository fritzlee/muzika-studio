import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PostCommunityListComponent, PostMusicListComponent, PostVideoListComponent} from './pages/post-list/post-list';
import {
  PostCommunityItemDetailComponent, PostMusicItemDetailComponent,
  PostVideoItemDetailComponent
} from './pages/post-item-detail/post-item-detail';
import {PostMusicWriteCompleteComponent} from './pages/post-write-complete/music/post-music-write-complete.component';
import {PostCommunityWriteComponent, PostMusicWriteComponent, PostVideoWriteComponent} from './pages/post-write/post-write';
import {PostCommunityModifyComponent, PostMusicModifyComponent, PostVideoModifyComponent} from './pages/post-modify/post-modify';
const routes: Routes = [
  { path: 'board/community/write', component: PostCommunityWriteComponent },
  { path: 'board/music/write', component: PostMusicWriteComponent },
  { path: 'board/music/write/complete', component: PostMusicWriteCompleteComponent },
  { path: 'board/video/write', component: PostVideoWriteComponent },

  { path: 'board/community/modify', component: PostCommunityModifyComponent },
  { path: 'board/music/modify', component: PostMusicModifyComponent },
  { path: 'board/video/modify', component: PostVideoModifyComponent },

  {
    path: 'board/community',
    component: PostCommunityListComponent,
    children: [{ path: ':id', component: PostCommunityItemDetailComponent }]
  },
  {
    path: 'board/music',
    component: PostMusicListComponent,
    children: [{ path: ':id', component: PostMusicItemDetailComponent }]
  },
  {
    path: 'board/video',
    component: PostVideoListComponent,
    children: [{ path: ':id', component: PostVideoItemDetailComponent }]
  },
];

export const AppPostRouteModule: ModuleWithProviders = RouterModule.forChild(routes);
