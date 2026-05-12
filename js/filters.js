/* MAX SPATIAL CRAFT — filters.js */
document.querySelectorAll('.f-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    // deactivate all
    document.querySelectorAll('.f-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');

    var filter = btn.dataset.filter;

    document.querySelectorAll('[data-cat]').forEach(function(card) {
      var cats = card.dataset.cat || '';
      var show = filter === 'all' || cats.split(' ').indexOf(filter) !== -1;
      card.style.display = show ? '' : 'none';
    });
  });
});
