"use strict";

const router = require("../router.js");
const api = require("../api.js");
const uri = require("../util/uri.js");
const misc = require("../util/misc.js");
const settings = require("../models/settings.js");
const Comment = require("../models/comment.js");
const Post = require("../models/post.js");
const PostList = require("../models/post_list.js");
const PostMainView = require("../views/post_main_view.js");
const BasePostController = require("./base_post_controller.js");
const EmptyView = require("../views/empty_view.js");

class PostMainController extends BasePostController {
    constructor(ctx, editMode) {
        super(ctx);

        let poolPostsAround = Promise.resolve({results: [], activePool: null});
        if (api.hasPrivilege("pools:list") && api.hasPrivilege("pools:view")) {
            poolPostsAround = PostList.getPoolPostsAround(
                ctx.parameters.id,
                parameters ? parameters.query : null
            );
        }

        let parameters = ctx.parameters;
        Promise.all([
            Post.get(ctx.parameters.id),
            PostList.getAround(
                ctx.parameters.id,
                parameters ? parameters.query : null
            ),
            poolPostsAround
        ]).then(
            (responses) => {
                const [post, aroundResponse, poolPostsAroundResponse] = responses;
                let activePool = null;

                // remove junk from query, but save it into history so that it can
                // be still accessed after history navigation / page refresh
                if (parameters.query) {
                    ctx.state.parameters = parameters;
                    const url = editMode
                        ? uri.formatClientLink(
                              "post",
                              ctx.parameters.id,
                              "edit"
                          )
                        : uri.formatClientLink("post", ctx.parameters.id);
                    router.replace(url, ctx.state, false);
                    //console.log(parameters.query);
                    parameters.query.split(" ").forEach((item) => {
                        const found = item.match(/^pool:([0-9]+)/i);
                        if (found) {
                            const foundPool = parseInt(found[1]);
                            poolPostsAroundResponse.forEach((nearbyPosts) => {
                                if (nearbyPosts.pool.id == foundPool) {
                                    activePool = nearbyPosts
                                }
                            });
                        }
                    });
                }

                this._post = post;
                this._view = new PostMainView({
                    post: post,
                    poolPostsAround: poolPostsAroundResponse,
                    activePool: activePool,
                    editMode: editMode,
                    prevPostId: activePool
                        ? (activePool.prevPost ? activePool.prevPost.id : null)
                        : (aroundResponse.prev ? aroundResponse.prev.id : null),
                    nextPostId: activePool
                        ? (activePool.nextPost ? activePool.nextPost.id : null)
                        : (aroundResponse.next ? aroundResponse.next.id : null),
                    canEditPosts: api.hasPrivilege("posts:edit"),
                    canEditPostDescription: api.hasPrivilege("posts:edit:description"),
                    canDeletePosts: api.hasPrivilege("posts:delete"),
                    canFeaturePosts: api.hasPrivilege("posts:feature"),
                    canListComments: api.hasPrivilege("comments:list"),
                    canCreateComments: api.hasPrivilege("comments:create"),
                    canListPools: api.hasPrivilege("pools:list"),
                    canViewPools: api.hasPrivilege("pools:view"),
                    parameters: parameters,
                });

                if (this._view.sidebarControl) {
                    this._view.sidebarControl.addEventListener(
                        "favorite",
                        (e) => this._evtFavoritePost(e)
                    );
                    this._view.sidebarControl.addEventListener(
                        "unfavorite",
                        (e) => this._evtUnfavoritePost(e)
                    );
                    this._view.sidebarControl.addEventListener("score", (e) =>
                        this._evtScorePost(e)
                    );
                    this._view.sidebarControl.addEventListener(
                        "fitModeChange",
                        (e) => this._evtFitModeChange(e)
                    );
                    this._view.sidebarControl.addEventListener("change", (e) =>
                        this._evtPostChange(e)
                    );
                    this._view.sidebarControl.addEventListener("submit", (e) =>
                        this._evtUpdatePost(e)
                    );
                    this._view.sidebarControl.addEventListener(
                        "feature",
                        (e) => this._evtFeaturePost(e)
                    );
                    this._view.sidebarControl.addEventListener("delete", (e) =>
                        this._evtDeletePost(e)
                    );
                    this._view.sidebarControl.addEventListener("merge", (e) =>
                        this._evtMergePost(e)
                    );
                }

                if (this._view.commentControl) {
                    this._view.commentControl.addEventListener("change", (e) =>
                        this._evtCommentChange(e)
                    );
                    this._view.commentControl.addEventListener("submit", (e) =>
                        this._evtCreateComment(e)
                    );
                }

                if (this._view.commentListControl) {
                    this._view.commentListControl.addEventListener(
                        "submit",
                        (e) => this._evtUpdateComment(e)
                    );
                    this._view.commentListControl.addEventListener(
                        "score",
                        (e) => this._evtScoreComment(e)
                    );
                    this._view.commentListControl.addEventListener(
                        "delete",
                        (e) => this._evtDeleteComment(e)
                    );
                }

                if (this._view.postDescription) {
                    this._view.postDescription.addEventListener("change", (e) =>
                        this._evtPostChange(e)
                    );
                }
            },
            (error) => {
                this._view = new EmptyView();
                this._view.showError(error.message);
            }
        );
    }

    _evtFitModeChange(e) {
        const browsingSettings = settings.get();
        browsingSettings.fitMode = e.detail.mode;
        settings.save(browsingSettings);
    }

    _evtFeaturePost(e) {
        this._view.sidebarControl.disableForm();
        this._view.sidebarControl.clearMessages();
        e.detail.post.feature().then(
            () => {
                this._view.sidebarControl.showSuccess("Post featured.");
                this._view.sidebarControl.enableForm();
            },
            (error) => {
                this._view.sidebarControl.showError(error.message);
                this._view.sidebarControl.enableForm();
            }
        );
    }

    _evtMergePost(e) {
        router.show(uri.formatClientLink("post", e.detail.post.id, "merge"));
    }

    _evtDeletePost(e) {
        this._view.sidebarControl.disableForm();
        this._view.sidebarControl.clearMessages();
        e.detail.post.delete().then(
            () => {
                misc.disableExitConfirmation();
                const ctx = router.show(uri.formatClientLink("posts"));
                ctx.controller.showSuccess("Post deleted.");
            },
            (error) => {
                this._view.sidebarControl.showError(error.message);
                this._view.sidebarControl.enableForm();
            }
        );
    }

    _evtUpdatePost(e) {
        this._view.sidebarControl.disableForm();
        this._view.sidebarControl.clearMessages();
        const post = e.detail.post;
        if (e.detail.safety !== undefined && e.detail.safety !== null) {
            post.safety = e.detail.safety;
        }
        if (e.detail.flags !== undefined && e.detail.flags !== null) {
            post.flags = e.detail.flags;
        }
        if (e.detail.relations !== undefined && e.detail.relations !== null) {
            post.relations = e.detail.relations;
        }
        if (e.detail.content !== undefined && e.detail.content !== null) {
            post.newContent = e.detail.content;
        }
        if (e.detail.thumbnail !== undefined && e.detail.thumbnail !== null) {
            post.newThumbnail = e.detail.thumbnail;
        }
        if (e.detail.source !== undefined && e.detail.source !== null) {
            post.source = e.detail.source;
        }
        if (e.detail.description !== undefined) {
            post.description = e.detail.description;
        }
        post.save().then(
            () => {
                this._view.sidebarControl.showSuccess("Post saved.");
                this._view.sidebarControl.enableForm();
                misc.disableExitConfirmation();
            },
            (error) => {
                this._view.sidebarControl.showError(error.message);
                this._view.sidebarControl.enableForm();
            }
        );
    }

    _evtPostChange(e) {
        misc.enableExitConfirmation();
    }

    _evtCommentChange(e) {
        misc.enableExitConfirmation();
    }

    _evtCreateComment(e) {
        this._view.commentControl.disableForm();
        const comment = Comment.create(this._post.id);
        comment.text = e.detail.text;
        comment.save().then(
            () => {
                this._post.comments.add(comment);
                this._view.commentControl.exitEditMode();
                this._view.commentControl.enableForm();
                misc.disableExitConfirmation();
            },
            (error) => {
                this._view.commentControl.showError(error.message);
                this._view.commentControl.enableForm();
            }
        );
    }

    _evtUpdateComment(e) {
        // TODO: disable form
        e.detail.comment.text = e.detail.text;
        e.detail.comment.save().catch((error) => {
            e.detail.target.showError(error.message);
            // TODO: enable form
        });
    }

    _evtScoreComment(e) {
        e.detail.comment
            .setScore(e.detail.score)
            .catch((error) => window.alert(error.message));
    }

    _evtDeleteComment(e) {
        e.detail.comment
            .delete()
            .catch((error) => window.alert(error.message));
    }

    _evtScorePost(e) {
        if (!api.hasPrivilege("posts:score")) {
            return;
        }
        e.detail.post
            .setScore(e.detail.score)
            .catch((error) => window.alert(error.message));
    }

    _evtFavoritePost(e) {
        if (!api.hasPrivilege("posts:favorite")) {
            return;
        }
        e.detail.post
            .addToFavorites()
            .catch((error) => window.alert(error.message));
    }

    _evtUnfavoritePost(e) {
        if (!api.hasPrivilege("posts:favorite")) {
            return;
        }
        e.detail.post
            .removeFromFavorites()
            .catch((error) => window.alert(error.message));
    }
}

module.exports = (router) => {
    router.enter(["post", ":id", "edit"], (ctx, next) => {
        // restore parameters from history state
        if (ctx.state.parameters) {
            Object.assign(ctx.parameters, ctx.state.parameters);
        }
        ctx.controller = new PostMainController(ctx, true);
    });
    router.enter(["post", ":id"], (ctx, next) => {
        // restore parameters from history state
        if (ctx.state.parameters) {
            Object.assign(ctx.parameters, ctx.state.parameters);
        }
        ctx.controller = new PostMainController(ctx, false);
    });
};
