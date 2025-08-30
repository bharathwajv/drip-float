// pages/history.js

document.body.addEventListener('click', (e) => {
  const item = e.target.closest('.history-item');
  if (!item) return;
  
  // Add click feedback
  item.style.transform = 'scale(0.98)';
  setTimeout(() => {
    item.style.transform = '';
  }, 150);
  
  // Placeholder: in the future this would deep-link to a detail page
  console.log('History item clicked:', item.querySelector('.item-title').textContent);
});
