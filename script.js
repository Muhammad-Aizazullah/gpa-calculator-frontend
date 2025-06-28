document.addEventListener('DOMContentLoaded', () => {
    // API URL ko apne PythonAnywhere backend ke URL se replace kiya gaya hai
    const apiUrl = "https://Aizazullah.pythonanywhere.com"; // **APNA PYTHONANYWHERE USERNAME YAHAN DALEIN**

    const gpaForm = document.getElementById('gpaForm');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const notificationArea = document.getElementById('notificationArea');
    const togglePriorBtn = document.getElementById('togglePriorBtn');
    const togglePlanningBtn = document.getElementById('togglePlanningBtn');
    const calculateRequiredGpaBtn = document.getElementById('calculateRequiredGpaBtn');
    const calculateFinalGpaBtn = document.getElementById('calculateFinalGpaBtn');
    const planningResultDiv = document.getElementById('planningResult');
    const finalGpaResultDiv = document.getElementById('finalGpaResult');
    const languageSelector = document.getElementById('languageSelector');

    function showNotification(message, type) {
        notificationArea.innerHTML = `<div class="notification ${type}">${message}</div>`;
        const notificationDiv = notificationArea.querySelector('.notification');
        notificationDiv.style.display = 'block';

        setTimeout(() => {
            notificationDiv.style.display = 'none';
        }, 4000);
    }

    async function updateCurrentGPA() {
        try {
            const gpaResponse = await fetch(`${apiUrl}/gpa`);
            if (!gpaResponse.ok) throw new Error('Network response was not ok');
            
            const gpaData = await gpaResponse.json();
            document.getElementById('gpaDisplay').textContent = `Current GPA: ${gpaData.gpa.toFixed(2)}`;
        } catch (error) {
            showNotification('Could not update GPA. Make sure the server is running.', 'error');
        }
    }

    async function addCourse(event) {
        event.preventDefault();
        
        const course = document.getElementById("course")?.value.trim();
        const credit = parseInt(document.getElementById("credit")?.value);
        const grade = document.getElementById("grade")?.value;

        if (!course || !credit || !grade) {
            showNotification('Please fill all fields.', 'error');
            return;
        }

        addCourseBtn.disabled = true;
        addCourseBtn.textContent = 'Adding...';

        try {
            const response = await fetch(`${apiUrl}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course, credit, grade }),
            });

            const result = await response.json();
            if (response.ok) {
                showNotification(result.message, 'success');
                updateCourseList();
                gpaForm.reset();
            } else {
                throw new Error(result.error || 'Failed to add course.');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            addCourseBtn.disabled = false;
            addCourseBtn.textContent = '➕ Add Course';
        }
    }

    async function updateCourseList() {
        try {
            const coursesResponse = await fetch(`${apiUrl}/courses`);
            const courses = await coursesResponse.json();
            
            const courseList = document.getElementById('courseList');
            courseList.innerHTML = '';
            courses.forEach(course => {
                const li = document.createElement('li');
                li.textContent = `${course.course_name} - Credits: ${course.credit_hours}, Grade: ${course.grade}`;
                courseList.appendChild(li);
            });
            
            updateCurrentGPA();

        } catch (error) {
            showNotification('Failed to load course data.', 'error');
        }
    }
    
    function calculateRequiredGPA() {
        const currentGPA = parseFloat(document.getElementById("currentGPA").value);
        const targetGPA = parseFloat(document.getElementById("targetGPA").value);
        const currentCredits = parseInt(document.getElementById("currentCredits").value);
        const additionalCredits = parseInt(document.getElementById("additionalCredits").value);

        if (isNaN(currentGPA) || isNaN(targetGPA) || isNaN(currentCredits) || isNaN(additionalCredits)) {
             showNotification('Please fill all fields for GPA planning.', 'error');
             planningResultDiv.textContent = '';
             return;
        }

        const totalCredits = currentCredits + additionalCredits;
        const requiredGPA = ((targetGPA * totalCredits) - (currentGPA * currentCredits)) / additionalCredits;

        if (requiredGPA > 4.0) {
            planningResultDiv.textContent = `Target not achievable. Need GPA: ${requiredGPA.toFixed(2)}`;
        } else if (requiredGPA < 0) {
            planningResultDiv.textContent = `Target is easily achievable!`;
        } else {
            planningResultDiv.textContent = `Required GPA for next credits: ${requiredGPA.toFixed(2)}`;
        }
    }

    async function calculateFinalGPA() {
        const priorGPA = parseFloat(document.getElementById('priorGPA').value) || 0;
        const completedCredits = parseInt(document.getElementById('completedCredits').value) || 0;

        if (priorGPA === 0 || completedCredits === 0) {
            showNotification('Please enter prior semester data.', 'error');
            finalGpaResultDiv.textContent = '';
            return;
        }

        try {
            const gpaResponse = await fetch(`${apiUrl}/gpa?prior_gpa=${priorGPA}&completed_credits=${completedCredits}`);
            if (!gpaResponse.ok) throw new Error('Could not fetch final GPA');
            
            const gpaData = await gpaResponse.json();
            finalGpaResultDiv.textContent = `Your Final Cumulative GPA is: ${gpaData.gpa.toFixed(2)}`;

        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function resetAll() {
        try {
            const response = await fetch(`${apiUrl}/reset`, { method: 'POST' });
            if (!response.ok) throw new Error('Could not reset data.');
            
            const result = await response.json();
            showNotification(result.message, 'success');
            updateCourseList();
            finalGpaResultDiv.textContent = '';
            planningResultDiv.textContent = '';
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    function toggleSection(sectionId) {
        document.getElementById(sectionId).classList.toggle('hidden');
    }
    
    function changeLanguage() {
        const selectedPage = languageSelector.value;
        if(selectedPage) {
            window.location.href = selectedPage;
        }
    }

    // --- Event Listeners ---
    gpaForm.addEventListener('submit', addCourse);
    resetBtn.addEventListener('click', resetAll);
    togglePriorBtn.addEventListener('click', () => toggleSection('priorSemesterSection'));
    togglePlanningBtn.addEventListener('click', () => toggleSection('gpaPlanningSection'));
    calculateRequiredGpaBtn.addEventListener('click', calculateRequiredGPA);
    calculateFinalGpaBtn.addEventListener('click', calculateFinalGPA);
    languageSelector.addEventListener('change', changeLanguage);

    updateCourseList();
});
