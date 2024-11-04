<div class='pool-navigator-container'>
  <div class='pool-info-wrapper <%= ctx.isActivePool ? "active" : "" %>'>
    <span class='first'>
      <% if (ctx.canViewPosts && ctx.firstPost) { %>
        <a class='<%- ctx.linkClass %>' href='<%= ctx.getPostUrl(ctx.firstPost.id, ctx.parameters) %>'>
      <% } %>
      «
      <% if (ctx.canViewPosts && ctx.firstPost) { %>
        </a>
      <% } %>
    </span>
    <span class='prev'>
      <% if (ctx.canViewPosts && ctx.prevPost) { %>
        <a class='<%- ctx.linkClass %>' href='<%= ctx.getPostUrl(ctx.prevPost.id, ctx.parameters) %>'>
      <% } %>
        ‹ prev
      <% if (ctx.canViewPosts && ctx.prevPost) { %>
        </a>
      <% } %>
    </span>
    <span class='pool-name'>
      <% if (ctx.canViewPools) { %>
        <a class='<%- ctx.linkClass %>' href='<%= ctx.formatClientLink('posts', {query: 'pool:' + ctx.pool.id + ' -sort:pool'}) %>'>
      <% } %>
        Pool: <%- ctx.getPrettyName(ctx.pool.names[0]) %>
      <% if (ctx.canViewPools) { %>
        </a>
      <% } %>
      <% if (ctx.canViewPools) { %>
        <a class='pool-edit' href='<%= ctx.formatClientLink("pool", ctx.pool.id) %>'><i class='fa fa-tag'></i></a>
      <% } %>
    </span>
    <span class='next'>
      <% if (ctx.canViewPosts && ctx.nextPost) { %>
        <a class='<%- ctx.linkClass %>' href='<%= ctx.getPostUrl(ctx.nextPost.id, ctx.parameters) %>'>
      <% } %>
        next ›
      <% if (ctx.canViewPosts && ctx.nextPost) { %>
        </a>
      <% } %>
    </span>
    <span class='last'>
      <% if (ctx.canViewPosts && ctx.lastPost) { %>
        <a class='<%- ctx.linkClass %>' href='<%= ctx.getPostUrl(ctx.lastPost.id, ctx.parameters) %>'>
      <% } %>
      »
      <% if (ctx.canViewPosts && ctx.lastPost) { %>
        </a>
      <% } %>
    </span>
  </div>
</div>