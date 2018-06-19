import {NgRedux} from '@angular-redux/store';
import {isPlatformBrowser} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {Inject, Injectable, PLATFORM_ID} from '@angular/core';
import {BasePost, InfPaginationResult, PaginationResult, PostActionType, IAppState, BoardType} from '@muzika/core';
import {Observable, from} from 'rxjs';
import {map} from 'rxjs/operators';
import {APIConfig} from '../config/api.config';
import {ParamsBuilder} from '../config/params.builder';
import {MuzikaCoin} from '../contracts/interface/MuzikaCoin';
import {MuzikaPaperContract} from '../contracts/interface/MuzikaPaperContract';
import {UserActions} from './user.action';

@Injectable({providedIn: 'root'})
export class PostActions {

  constructor(private store: NgRedux<IAppState>,
              private apiConfig: APIConfig,
              private userActions: UserActions,
              private muzikaPaper: MuzikaPaperContract,
              private muzikaCoin: MuzikaCoin,
              @Inject(PLATFORM_ID) private platformId) {
  }

  write(boardType, post): Observable<any> {
    return this.apiConfig.post(`/board/${boardType}`, post);
  }

  visit(boardType: string, boardID: number) {
    if (isPlatformBrowser(this.platformId)) { // Server side rendering에서는 업데이트 안함
      this.apiConfig
        .post('board/row/update', {
          boardType, boardID
        }).subscribe();
    }
  }

  like(boardType: string, boardID: number, diff: number): Observable<any> {
    return this.apiConfig.post<any>(`/board/${boardType}/${boardID}/like`, {})
      .pipe(
        map(data => {
          if (data.status === 'success') {
            this.userActions.loadBoardLikes(boardType);
            this.store.dispatch({
              type: PostActionType.LIKE_TOGGLE_POST,
              boardType, diff, boardID
            });
          }
          return data;
        })
      );
  }

  remove(boardType: string, boardID: number) {
    return this.apiConfig.delete(`/board/${boardType}/${boardID}`);
  }

  /**
   * Purchase music. If success, returns transaction hash
   *
   * @param {string} contractAddress
   * @param {string} buyer
   * @returns {Observable<string>} transaction hash
   */
  purchase(contractAddress: string, buyer: string): Observable<string> {
    const func = async () => {
      const coin = await this.muzikaCoin.deployed();
      const paper = await this.muzikaPaper.at(contractAddress);
      const price = (await paper.price()).toString(10);
      const estimateGas = await coin.increaseApprovalAndCall.estimateGas(
        contractAddress,
        price,
        '0x',
        {from: buyer}
      );
      return await coin.increaseApprovalAndCall.sendTransaction(
        contractAddress,
        price,
        '0x',
        {from: buyer, gas: estimateGas + 30000}
      );
    };

    return from(func());
  }

  violation(boardType, boardID, commentID, reason: string) {
    // return this.http
    //   .post<any>(this.apiConfig.legacy_api_url, {
    //     mode: 'violationRequest',
    //     boardType: boardType,
    //     boardID: boardID,
    //     commentID: commentID,
    //     reason: reason
    //   })
    //   .pipe(map((res: any) => res.request));
  }

  resetPosts(boardType: string) {
    this.store.dispatch({
      type: PostActionType.RESET_POSTS,
      payload: {boardType}
    });
  }

  resetInfPosts(boardType: string) {
    this.store.dispatch({
      type: PostActionType.RESET_INF_POSTS,
      payload: {boardType}
    });
  }

  loadPost(boardType, boardID) {
    this.apiConfig.get<BasePost>(`/board/${boardType}/${boardID}`)
      .subscribe(
        (post) => {
          this.savePost(boardType, post);
          this.visit(boardType, +boardID);
        },
        (err: HttpErrorResponse) => {
          if (err.error instanceof Error) {
            // A client-side or network error occurred. Handle it accordingly.
            console.log('An error occurred:', err.error.message);
          } else {
            console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
          }
        });
  }

  loadInfPosts(boardType: string, mode: string, params: Object) {
    const currentPosts: InfPaginationResult<BasePost> = this.store.getState().post.infPosts[boardType];
    if (mode === 'after' && currentPosts.after !== null) {
      params['after'] = currentPosts.after;
    } else if (currentPosts.before !== null) {
      params['before'] = currentPosts.before;
    }
    this.requestPosts(boardType,
      (mode === 'after') ? PostActionType.INSERT_POSTS_AFTER_LIST : PostActionType.INSERT_POSTS_BEFORE_LIST,
      params);
  }

  loadPosts(boardType: string, page: string, params: Object) {
    params['page'] = page;
    this.requestPosts(boardType, PostActionType.INSERT_POSTS_LIST, params);
  }

  loadMyPosts(boardType: string, page: string, params: Object) {
    params['page'] = page;
    this.requestPosts(boardType, PostActionType.INSERT_POSTS_LIST, params, true);
  }

  loadAdditional(boardType: string, boardID: number, is_modify: boolean): Observable<any> {
    return this.apiConfig
      .get(`/board/${boardType}/${boardID}/additional`, {
        params: ParamsBuilder.from({is_modify})
      })
      .pipe(
        map(data => {
          this.store.dispatch({
            type: PostActionType.SAVE_POST_ADDITION,
            boardType: boardType,
            boardID: boardID,
            additionalInfo: data
          });
          return data;
        })
      );
  }

  private savePost(boardType: string, post: BasePost, update_column = 'all') {
    this.store.dispatch({
      type: PostActionType.SAVE_POSTS,
      boardType, update_column,
      posts: [post],
    });
  }

  private requestPosts(boardType: string, dispatchType: string, params: Object, onlyUser?: boolean) {
    const frontURL = (onlyUser) ? '/user' : '';

    this.apiConfig
      .get<PaginationResult<BasePost> | InfPaginationResult<BasePost>>(`${frontURL}/board/${boardType}`, {
        params: ParamsBuilder.from(params)
      })
      .subscribe((data: any) => {
        if (onlyUser) {
          data.boardType = BoardType.OWN(boardType);
        } else {
          data.boardType = boardType;
        }

        // trigger post inserting
        this.store.dispatch({
          type: dispatchType,
          payload: data
        });
      });
  }
}