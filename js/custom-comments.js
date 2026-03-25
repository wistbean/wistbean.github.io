(function () {
  function getPostId(container, key) {
    if (key === 'path') {
      return window.location.pathname;
    }
    if (key === 'url') {
      return window.location.href;
    }
    if (key === 'title') {
      var titleEl = document.querySelector('h1') || document.querySelector('title');
      return titleEl ? titleEl.textContent.trim() : window.location.pathname;
    }
    return window.location.pathname;
  }

  function escapeText(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderComment(item) {
    var author = escapeText(item.author || '匿名');
    var website = item.website ? escapeText(item.website) : '';
    var time = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
    var content = escapeText(item.content || '');
    var authorHtml = website ? '<a href="' + website + '" rel="nofollow noopener" target="_blank">' + author + '</a>' : author;

    return (
      '<div class="custom-comments__item">' +
      '  <div class="custom-comments__meta">' + authorHtml + (time ? ' · ' + time : '') + '</div>' +
      '  <div class="custom-comments__content">' + content.replace(/\n/g, '<br>') + '</div>' +
      '</div>'
    );
  }

  function init(container) {
    var apiBase = container.getAttribute('data-api-base');
    var postIdKey = container.getAttribute('data-post-id-key');
    var pageSize = parseInt(container.getAttribute('data-page-size'), 10) || 20;
    var requireEmail = container.getAttribute('data-require-email') === 'true';
    var requireWebsite = container.getAttribute('data-require-website') === 'true';
    var placeholder = container.getAttribute('data-placeholder') || '说点什么...';

    var listEl = container.querySelector('.custom-comments__list');
    var formEl = container.querySelector('.custom-comments__form');
    var statusEl = container.querySelector('.custom-comments__status');
    var textareaEl = container.querySelector('.custom-comments__textarea');

    textareaEl.placeholder = placeholder;

    var postId = getPostId(container, postIdKey);

    function setStatus(message, type) {
      statusEl.textContent = message || '';
      statusEl.className = 'custom-comments__status' + (type ? ' is-' + type : '');
    }

    function fetchComments() {
      listEl.innerHTML = '<div class="custom-comments__loading">加载中...</div>';
      fetch(apiBase + '/api/comments?postId=' + encodeURIComponent(postId) + '&pageSize=' + pageSize)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var items = data && data.items ? data.items : [];
          if (!items.length) {
            listEl.innerHTML = '<div class="custom-comments__empty">暂无评论</div>';
            return;
          }
          listEl.innerHTML = items.map(renderComment).join('');
        })
        .catch(function () {
          listEl.innerHTML = '<div class="custom-comments__error">加载失败，请稍后重试</div>';
        });
    }

    formEl.addEventListener('submit', function (event) {
      event.preventDefault();
      var formData = new FormData(formEl);
      var payload = {
        postId: postId,
        author: (formData.get('author') || '').toString().trim(),
        email: (formData.get('email') || '').toString().trim(),
        website: (formData.get('website') || '').toString().trim(),
        content: (formData.get('content') || '').toString().trim()
      };

      if (!payload.author) {
        setStatus('请填写昵称', 'error');
        return;
      }
      if (!payload.content) {
        setStatus('请填写评论内容', 'error');
        return;
      }
      if (requireEmail && !payload.email) {
        setStatus('请填写邮箱', 'error');
        return;
      }
      if (requireWebsite && !payload.website) {
        setStatus('请填写网站', 'error');
        return;
      }

      setStatus('提交中...', 'info');

      fetch(apiBase + '/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || data.error) {
            setStatus(data && data.error ? data.error : '提交失败', 'error');
            return;
          }
          formEl.reset();
          textareaEl.placeholder = placeholder;
          setStatus('提交成功', 'success');
          fetchComments();
        })
        .catch(function () {
          setStatus('提交失败，请稍后重试', 'error');
        });
    });

    fetchComments();
  }

  var containers = document.querySelectorAll('.custom-comments');
  if (!containers.length) {
    return;
  }
  containers.forEach(init);
})();
