let tasks = { todo: [], done: [] };
let currentFilter = 'all';

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem('tasks');
  if(saved) tasks = JSON.parse(saved);
}

function suggestPriority(dueDate){
  if(!dueDate) return 'Medium';
  const diff = (new Date(dueDate) - new Date())/(1000*60*60);
  if(diff<24) return 'High';
  if(diff<72) return 'Medium';
  return 'Low';
}

function addTask(){
  const text = document.getElementById('taskInput').value.trim();
  const category = document.getElementById('categoryInput').value;
  const dueDate = document.getElementById('dueDateInput').value;
  if(text){
    tasks.todo.push({
      text, category, dueDate, priority: suggestPriority(dueDate)
    });
    document.getElementById('taskInput').value='';
    document.getElementById('dueDateInput').value='';
    saveTasks();
    renderTasks();
  }
}

function completeTask(index){
  const task = tasks.todo.splice(index,1)[0];
  tasks.done.push(task);
  saveTasks(); renderTasks();
}

function undoTask(index){
  const task = tasks.done.splice(index,1)[0];
  tasks.todo.push(task);
  saveTasks(); renderTasks();
}

function deleteTask(index,type){
  tasks[type].splice(index,1);
  saveTasks(); renderTasks();
}

function filterTasks(type){
  currentFilter=type;
  document.querySelectorAll('.filters button').forEach(btn=>btn.classList.remove('active'));
  document.querySelector(`.filters button:nth-child(${type==='all'?1:type==='todo'?2:3})`).classList.add('active');
  renderTasks();
}

function renderTasks(){
  const taskList=document.getElementById('taskList');
  taskList.innerHTML='';
  const priorityFilter=document.getElementById('priorityFilter').value;

  let list=[];
  if(currentFilter==='all'||currentFilter==='todo')
    list.push(...tasks.todo.map((t,i)=>({...t,index:i,type:'todo'})));
  if(currentFilter==='all'||currentFilter==='done')
    list.push(...tasks.done.map((t,i)=>({...t,index:i,type:'done'})));

  if(priorityFilter!=='all') list=list.filter(t=>t.priority===priorityFilter);

  const priorityOrder={High:1,Medium:2,Low:3};
  list.sort((a,b)=>priorityOrder[a.priority]-priorityOrder[b.priority]||(new Date(a.dueDate)-new Date(b.dueDate)));

  list.forEach(({text,index,type,category,dueDate,priority})=>{
    const div=document.createElement('div');
    div.className='task'+(type==='done'?' completed':'')+(type==='todo' && dueDate && new Date(dueDate)<new Date()?' overdue':'');
    div.innerHTML=`
      <span>${text} 
        <span class="badge ${priority}">${priority}</span>
        <span class="badge ${category}">${category}</span>
        ${dueDate? ' - '+dueDate:''}
      </span>
      <div class="task-actions">
        ${type==='todo'?`<button class="done" onclick="completeTask(${index})">Done</button>`:
          `<button class="undo" onclick="undoTask(${index})">Undo</button>`}
        <button class="delete" onclick="deleteTask(${index},'${type}')">Delete</button>
      </div>
    `;
    div.draggable=true;
    div.ondragstart=(e)=>{e.dataTransfer.setData('text/plain',index+','+type)};
    div.ondragover=(e)=>e.preventDefault();
    div.ondrop=(e)=>{
      const data=e.dataTransfer.getData('text').split(',');
      const fromIndex=+data[0], fromType=data[1];
      const task=tasks[fromType].splice(fromIndex,1)[0];
      tasks[type].splice(index,0,task);
      saveTasks(); renderTasks();
    };
    taskList.appendChild(div);
  });

  updateDashboard();
}

function updateDashboard(){
  const total=tasks.todo.length+tasks.done.length;
  const completed=tasks.done.length;
  const pending=tasks.todo.length;
  const highPriority=tasks.todo.filter(t=>t.priority==='High').length;

  document.getElementById('completedCount').innerText=completed;
  document.getElementById('pendingCount').innerText=pending;
  document.getElementById('highPriorityCount').innerText=highPriority;

  const progress=(total? (completed/total)*100 :0)+'%';
  document.getElementById('progressFill').style.width=progress;
}

loadTasks();
renderTasks();
