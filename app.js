// Simple SPA-like prototype for mini e-learning platform
const STORAGE_KEY = 'vibe_elearn_v1';

const DEFAULT_COURSES = [
  {
    id: 'c1',
    title: 'Intro to Web Development',
    description: 'Basics of HTML, CSS, and JavaScript. Build small interactive pages.',
    lessons: [
      { title: 'HTML Basics', completed: false },
      { title: 'CSS Fundamentals', completed: false },
      { title: 'JavaScript Intro', completed: false }
    ]
  },
  {
    id: 'c2',
    title: 'Fundamentals of UX',
    description: 'User-centered design principles and simple prototyping.',
    lessons: [
      { title: 'Design Thinking', completed: false },
      { title: 'Wireframing', completed: false },
      { title: 'Usability Testing', completed: false }
    ]
  },
  {
    id: 'c3',
    title: 'Intro to Data for Environmental Science',
    description: 'Collecting, visualizing, and interpreting simple environmental data.',
    lessons: [
      { title: 'Data Collection Methods', completed: false },
      { title: 'Excel & Charts', completed: false },
      { title: 'Basic Interpretation', completed: false }
    ]
  }
];

// application state
let state = {
  user: null,
  courses: []
};

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try {
      state = JSON.parse(raw);
      // migration: if legacy or missing fields add defaults
      if(!state.courses) state.courses = DEFAULT_COURSES;
    } catch(e) {
      state = { user: null, courses: DEFAULT_COURSES };
    }
  } else {
    state = { user: null, courses: DEFAULT_COURSES };
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function calcProgress(course){
  const total = course.lessons.length;
  const done = course.lessons.filter(l => l.completed).length;
  return Math.round((done / total) * 100);
}

function renderUser(){
  const welcome = document.getElementById('welcome');
  const btnLogin = document.getElementById('btn-login');
  if(state.user && state.user.name){
    welcome.textContent = `Hi, ${state.user.name}`;
    btnLogin.textContent = 'Sign out';
  } else {
    welcome.textContent = 'Guest';
    btnLogin.textContent = 'Login';
  }
}

function renderCourseList(filter = ''){
  const list = document.getElementById('course-list');
  list.innerHTML = '';
  const query = filter.trim().toLowerCase();
  state.courses.forEach(course => {
    if(query && !course.title.toLowerCase().includes(query) && !course.description.toLowerCase().includes(query)) return;
    const progress = calcProgress(course);
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <div>
        <h3>${course.title}</h3>
        <p class="muted">${course.description}</p>
      </div>
      <div class="course-meta">
        <div class="badge">${progress}%</div>
        <div style="margin-top:6px">
          <button class="btn small view-btn" data-id="${course.id}">View</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function renderCourseDetails(courseId){
  const details = document.getElementById('details');
  const course = state.courses.find(c => c.id === courseId);
  if(!course){
    details.innerHTML = `<p class="muted">Select a course to view details →</p>`;
    return;
  }
  const progress = calcProgress(course);
  let lessonsHtml = '';
  course.lessons.forEach((l, idx) => {
    lessonsHtml += `
      <li>
        <label>
          <input type="checkbox" data-course="${course.id}" data-idx="${idx}" ${l.completed ? 'checked' : ''} />
          ${l.title}
        </label>
      </li>
    `;
  });

  details.innerHTML = `
    <h2>${course.title}</h2>
    <p>${course.description}</p>

    <div class="progress-wrapper" aria-hidden="true">
      <div class="progress" style="width:${progress}%;"></div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <strong>${progress}% complete</strong>
      <button id="mark-complete" class="btn small" data-id="${course.id}">Mark course completed</button>
      <button id="reset-progress" class="btn small secondary" data-id="${course.id}">Reset progress</button>
    </div>

    <h4>Lessons</h4>
    <ul class="lessons">${lessonsHtml}</ul>
  `;
}

function toggleLesson(courseId, idx){
  const course = state.courses.find(c => c.id === courseId);
  if(!course) return;
  course.lessons[idx].completed = !course.lessons[idx].completed;
  saveState();
  renderCourseList();
  renderCourseDetails(courseId);
}

function markAllCompleted(courseId){
  const course = state.courses.find(c => c.id === courseId);
  if(!course) return;
  course.lessons.forEach(l => l.completed = true);
  saveState();
  renderCourseList();
  renderCourseDetails(courseId);
}

function resetProgress(courseId){
  const course = state.courses.find(c => c.id === courseId);
  if(!course) return;
  course.lessons.forEach(l => l.completed = false);
  saveState();
  renderCourseList();
  renderCourseDetails(courseId);
}

function exportJSON(){
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mini-elearn-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Event wiring
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderUser();
  renderCourseList();

  // search
  document.getElementById('search').addEventListener('input', (e) => {
    renderCourseList(e.target.value);
  });

  // click in course list (delegate)
  document.getElementById('course-list').addEventListener('click', (e) => {
    if(e.target.matches('.view-btn')){
      const id = e.target.dataset.id;
      renderCourseDetails(id);
    }
  });

  // details interactions (checkboxes, buttons) via delegation
  document.getElementById('details').addEventListener('change', (e) => {
    if(e.target.matches('input[type="checkbox"]')){
      const courseId = e.target.dataset.course;
      const idx = Number(e.target.dataset.idx);
      toggleLesson(courseId, idx);
    }
  });

  document.getElementById('details').addEventListener('click', (e) => {
    if(e.target.id === 'mark-complete'){
      markAllCompleted(e.target.dataset.id);
    } else if(e.target.id === 'reset-progress'){
      resetProgress(e.target.dataset.id);
    }
  });

  // login modal
  const modal = document.getElementById('modal');
  document.getElementById('btn-login').addEventListener('click', () => {
    if(state.user && state.user.name){
      // sign out
      state.user = null;
      saveState();
      renderUser();
      return;
    }
    modal.classList.remove('hidden');
    document.getElementById('username').focus();
  });
  document.getElementById('btn-close').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('btn-signin').addEventListener('click', () => {
    const name = document.getElementById('username').value.trim();
    if(!name) return alert('Please enter your name (mock sign-in).');
    state.user = { name };
    saveState();
    renderUser();
    modal.classList.add('hidden');
  });

  // export
  document.getElementById('btn-export').addEventListener('click', exportJSON);
});
