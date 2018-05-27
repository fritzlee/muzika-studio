import {Component, HostListener, Input, OnInit} from '@angular/core';
import {VideoPost, PostActions} from '@muzika/core';


// PC Only Component
@Component({
  selector: '[app-youtube-video-cell]',
  templateUrl: './youtube-video-cell.component.html',
  styleUrls: ['./youtube-video-cell.component.scss']
})
export class YoutubeVideoCellComponent implements OnInit {
  @Input()
  post: VideoPost;

  youtubeThumnnail: string;

  constructor(private postActions: PostActions) {
  }

  @HostListener('click', ['$event.target'])
  onClick() {
    // this.postActions.savePost('video', this.post);
  }

  ngOnInit() {
  }
}
