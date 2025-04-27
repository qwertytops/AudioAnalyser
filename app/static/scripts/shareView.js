function switchContent(section, clickedItem) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    document.querySelectorAll('.sidebar-Option').forEach(item => item.classList.remove('active'));
    clickedItem.classList.add('active');
}