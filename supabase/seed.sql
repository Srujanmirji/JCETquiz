-- ============================================================================
-- seed.sql — 40 workshop questions, 10 per quiz.
--
-- Idempotent: refuses to touch the bank once any answer has been graded, so
-- re-running mid-event cannot change a question a student has already sat.
-- ============================================================================

do $$
declare v_html uuid; v_css uuid; v_js uuid; v_py uuid;
begin
  if exists (select 1 from public.quiz_answers) then
    raise notice 'Graded attempts exist - seed skipped so live questions stay frozen.';
    return;
  end if;

  delete from public.questions;

  select id into v_html from public.quizzes where slug = 'html';
  select id into v_css  from public.quizzes where slug = 'css';
  select id into v_js   from public.quizzes where slug = 'javascript';
  select id into v_py   from public.quizzes where slug = 'python';

  -- ------------------------------------------------------------------ HTML --
  insert into public.questions (quiz_id, question_text, options, correct_option, explanation, position) values
  (v_html, 'What does HTML stand for?',
   '["Hyper Text Markup Language","High Text Machine Language","Hyper Transfer Markup Language","Home Tool Markup Language"]',
   0, 'HTML is the markup language used to structure content on the web.', 1),
  (v_html, 'Which tag creates the largest heading on a page?',
   '["<h6>","<heading>","<h1>","<head>"]',
   2, '<h1> is the highest level heading; <h6> is the smallest.', 2),
  (v_html, 'Which tag is used to create a hyperlink?',
   '["<link>","<a>","<href>","<url>"]',
   1, 'The anchor tag <a href="..."> creates a clickable link.', 3),
  (v_html, 'Which attribute specifies the source of an image?',
   '["href","link","src","source"]',
   2, 'src points at the image file; alt describes it.', 4),
  (v_html, 'Which tag creates an unordered (bulleted) list?',
   '["<ol>","<ul>","<li>","<list>"]',
   1, '<ul> is unordered; <ol> is ordered; <li> is an item inside either.', 5),
  (v_html, 'Which element creates a clickable button?',
   '["<button>","<btn>","<click>","<press>"]',
   0, 'The <button> element renders a native, keyboard-accessible button.', 6),
  (v_html, 'Which tag is used to collect user input on a page?',
   '["<data>","<entry>","<input>","<field>"]',
   2, '<input> renders a form control; its type attribute decides the kind.', 7),
  (v_html, 'Which of these is a semantic HTML element?',
   '["<div>","<span>","<nav>","<b>"]',
   2, '<nav> describes the meaning of its content; <div> and <span> do not.', 8),
  (v_html, 'Where does the visible content of a web page go?',
   '["Inside <head>","Inside <body>","Inside <title>","Inside <meta>"]',
   1, '<head> holds metadata; <body> holds everything the user sees.', 9),
  (v_html, 'Which attribute provides alternative text for an image?',
   '["title","src","alt","caption"]',
   2, 'alt describes the image for screen readers and when it fails to load.', 10);

  -- ------------------------------------------------------------------- CSS --
  insert into public.questions (quiz_id, question_text, options, correct_option, explanation, position) values
  (v_css, 'What does CSS stand for?',
   '["Computer Style Sheets","Cascading Style Sheets","Creative Style System","Colorful Style Sheets"]',
   1, 'CSS describes how HTML elements should be presented.', 1),
  (v_css, 'Which property changes the text colour of an element?',
   '["text-color","font-color","color","text-style"]',
   2, 'color sets the text colour; background-color sets the area behind it.', 2),
  (v_css, 'Which property changes the background colour of an element?',
   '["color","bgcolor","background-color","fill"]',
   2, 'background-color paints the element box behind its content.', 3),
  (v_css, 'Which property controls the size of text?',
   '["text-size","font-size","size","font-scale"]',
   1, 'font-size sets the rendered size of the text.', 4),
  (v_css, 'What does display: flex do?',
   '["Hides the element","Makes the element a flex container","Centres text","Adds a border"]',
   1, 'display: flex enables the flexbox layout model for the children.', 5),
  (v_css, 'Which symbol selects an element by its id?',
   '[".","#","*","@"]',
   1, '#header selects id="header"; a dot selects a class.', 6),
  (v_css, 'Which property sets the space INSIDE an element, between its content and its border?',
   '["margin","padding","border","spacing"]',
   1, 'Padding is inside the border; margin is outside it.', 7),
  (v_css, 'Which property changes the typeface of text?',
   '["font-family","text-font","font-type","typeface"]',
   0, 'font-family accepts a prioritised list of typefaces.', 8),
  (v_css, 'Which value of the display property hides an element completely?',
   '["hidden","none","invisible","collapse"]',
   1, 'display: none removes the element from the layout entirely.', 9),
  (v_css, 'Which CSS feature applies styles only at certain screen sizes?',
   '["@import","@media","@font-face","@keyframes"]',
   1, '@media queries are the basis of responsive design.', 10);

  -- ------------------------------------------------------------ JavaScript --
  insert into public.questions (quiz_id, question_text, options, correct_option, explanation, position) values
  (v_js, 'Which keyword declares a variable that cannot be reassigned?',
   '["var","let","const","static"]',
   2, 'const binds a name once; let allows reassignment.', 1),
  (v_js, 'Which keyword is used to declare a function?',
   '["func","def","function","method"]',
   2, 'function greet() { } declares a named function.', 2),
  (v_js, 'Which symbol is used for strict equality?',
   '["==","===","=","!="]',
   1, '=== compares value AND type; == converts types first.', 3),
  (v_js, 'What does console.log() do?',
   '["Creates a variable","Prints a message to the browser console","Reloads the page","Defines a function"]',
   1, 'console.log() writes to the developer console.', 4),
  (v_js, 'Which of these is a JavaScript data type?',
   '["decimal","string","character","integer"]',
   1, 'JavaScript has string, number, boolean, null, undefined, symbol and bigint.', 5),
  (v_js, 'What is the result of 10 + 5 in JavaScript?',
   '["15","105","\"105\"","Error"]',
   0, 'Both operands are numbers, so + performs addition.', 6),
  (v_js, 'Which keyword starts a conditional statement?',
   '["when","if","check","switch-case"]',
   1, 'if runs a block only when its condition is truthy.', 7),
  (v_js, 'What is the index of the FIRST item in a JavaScript array?',
   '["0","1","-1","null"]',
   0, 'JavaScript arrays are zero-indexed.', 8),
  (v_js, 'Which method finds an element by its id?',
   '["document.getElementById()","document.query()","document.findId()","document.getId()"]',
   0, 'getElementById returns the single element with the matching id.', 9),
  (v_js, 'Which event fires when a user clicks an element?',
   '["onhover","onclick","onpress","onselect"]',
   1, 'The click event fires on press-and-release, including keyboard activation.', 10);

  -- ---------------------------------------------------------------- Python --
  insert into public.questions (quiz_id, question_text, options, correct_option, explanation, position) values
  (v_py, 'What is Python?',
   '["A programming language","A database","An operating system","A web browser"]',
   0, 'Python is a general-purpose programming language.', 1),
  (v_py, 'Which function is used to display output in Python?',
   '["show()","print()","display()","output()"]',
   1, 'print() writes its arguments to standard output.', 2),
  (v_py, 'Which symbol is used to write a comment in Python?',
   '["//","<!-- -->","#","/* */"]',
   2, 'Everything after # on a line is ignored by Python.', 3),
  (v_py, 'Which of the following is a valid Python variable name?',
   '["1name","my-name","my_name","my name"]',
   2, 'Names may not start with a digit or contain hyphens or spaces.', 4),
  (v_py, 'What is the output of: print(5 + 3)',
   '["2","8","53","Error"]',
   1, 'Both values are numbers, so + adds them.', 5),
  (v_py, 'Which data type is used to store whole numbers in Python?',
   '["float","string","int","boolean"]',
   2, 'int holds whole numbers; float holds decimals.', 6),
  (v_py, 'Which of the following is a Python list?',
   '["{1, 2, 3}","(1, 2, 3)","[1, 2, 3]","<1, 2, 3>"]',
   2, 'Square brackets make a list; braces make a set and parentheses a tuple.', 7),
  (v_py, 'Which keyword is used for a condition in Python?',
   '["if","when","check","condition"]',
   0, 'if runs a block only when its condition is true.', 8),
  (v_py, 'What is the output of: name = "Srujan"  then  print(name)',
   '["name","\"name\"","Srujan","Error"]',
   2, 'print(name) shows the value stored in the variable, not the name itself.', 9),
  (v_py, 'Which keyword is used to define a function in Python?',
   '["function","func","define","def"]',
   3, 'def greet(): defines a function in Python.', 10);

  raise notice 'Seeded % questions.', (select count(*) from public.questions);
end $$;

-- The bank must be exactly 10 active questions per quiz, 40 in total.
do $$
declare r record; bad text := '';
begin
  for r in
    select z.slug, count(q.id) filter (where q.is_active) as n
    from public.quizzes z left join public.questions q on q.quiz_id = z.id
    where z.is_active group by z.slug
  loop
    if r.n <> 10 then bad := bad || format('%s=%s ', r.slug, r.n); end if;
  end loop;
  if bad <> '' then
    raise exception 'Each quiz must have 10 active questions. Got: %', bad;
  end if;
end $$;
