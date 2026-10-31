% Set font size and paper type
\LoadClass[11pt,letterpaper]{article}

% Enable custom colors
\RequirePackage[usenames,dvipsnames]{xcolor}

% Remove paragraph indentation
\usepackage[parfill]{parskip}

% Enable boldface for tabular columns
\usepackage{array}

% Enable if-then-else statements
\usepackage{ifthen}

% Suppress page numbers
\pagestyle{empty}

% Create a custom bullet point symbol
\usepackage{scalerel}
\usepackage{bbding,pifont}

%----------------------------------------------------------------------------------------
% Define black color for section headings and lines
%----------------------------------------------------------------------------------------
\definecolor{black}{RGB}{0,0,0}

%----------------------------------------------------------------------------------------
% Define custom bullet point symbol with scalable size
%----------------------------------------------------------------------------------------
\newcommand\sbullet[1][.5]{ 
    \mathbin{
        \ThisStyle{
            \vcenter{
                \hbox{
                    \scalebox{#1}{
                        $\SavedStyle\bullet$
                    }
                }
            }
        }
    }
}

%----------------------------------------------------------------------------------------
% Define name command for storing user's name
%----------------------------------------------------------------------------------------
\def \name#1{\def\@name{#1}}
\def \@name {}

%----------------------------------------------------------------------------------------
% Define printname command for printing the user's name
%----------------------------------------------------------------------------------------
\newcommand{\printname}{
    \begingroup
        \hfil
        {\namesize\bfseries\textit{\@name}}
        \hfil
        \vspace{0.5cm}
    \endgroup
}

%----------------------------------------------------------------------------------------
%   Define tag command for formatting tags (redefined at begin document so the
%   amsmath \tag (loaded via newtxmath) does not override this one)
%----------------------------------------------------------------------------------------
\AtBeginDocument{\renewcommand{\tag}[1]{\textcolor{black}{\textit{#1: }}}}

%----------------------------------------------------------------------------------------
% Define info command for formatting information text
%----------------------------------------------------------------------------------------
\newcommand{\info}[1]{\textcolor{black}{#1}}

%----------------------------------------------------------------------------------------
% Define personalInfo command for formatting personal information
%----------------------------------------------------------------------------------------
\newcommand{\personalInfo}[1]{\centerline{#1}\par\personalInfoSkip}

%----------------------------------------------------------------------------------------
% Define infoSeparator command for formatting separators in personal information
%----------------------------------------------------------------------------------------
\newcommand{\infoSeparator}{{\textcolor{black}{\ding{92}\hspace{0.1 cm}}}}

%----------------------------------------------------------------------------------------
% Define printPersonalInfo command for printing personal information
%----------------------------------------------------------------------------------------
\newcommand{\printPersonalInfo}[1]{
    \begin{center}
        #1
    \end{center}
    \vspace{-1cm}
}

%----------------------------------------------------------------------------------------
% Replace the document command with custom implementation
%----------------------------------------------------------------------------------------
\let\ori@document=\document
\renewcommand{\document}{
    \ori@document
    \begin{center}
        \printname
    \end{center}
}

%----------------------------------------------------------------------------------------
% Define rSection environment for formatting sections
%----------------------------------------------------------------------------------------
\newenvironment{rSection}[1]{
    \sectionskip
    {\color{black}{\bf \textit{#1}}}
    \sectionlineskip
    {\color{black}\hrule}
    \begin{list}{}{
        \setlength{\leftmargin}{1.5em}
    }
    \item[]
}{
    \end{list}
}

%----------------------------------------------------------------------------------------
% Define rSubsectionNoBullet environment for formatting education and work experience without bullet points
%----------------------------------------------------------------------------------------
\newenvironment{rSubsectionNoBullet}[4]{
    {\bf #1} \hfill {\textit{#2}} \newline
    \ifthenelse{\equal{#3}{}}{}{
        {\textit{#3}}
        \ifthenelse{\equal{#4}{}}{}{
            \hfill {\textit{#4}}
        }
    }
    \begin{list}{}{
        \leftmargin=0em \itemindent=0em \labelwidth=0em \labelsep=0em
    }
    \itemsep -0.7em \vspace{-0.7em}
}{
    \end{list}
}

%----------------------------------------------------------------------------------------
% Define rSubsection environment for formatting education and work experience with bullet points
%----------------------------------------------------------------------------------------
\newenvironment{rSubsection}[4]{
    {\bf #1} \hfill {\textit{#2}} \newline
    \ifthenelse{\equal{#3}{}}{}{
        {\textit{#3}} \hfill {\textit{#4}}
    }
    \smallskip
    \begin{list}{$\sbullet[.65]$}{
        \leftmargin=2em
    }
    \itemsep -0.5em \vspace{-0.5em}
}{
    \end{list}
    \vspace{0.5em}
}

%----------------------------------------------------------------------------------------
%   Define spacings after certain elements in the document
%----------------------------------------------------------------------------------------
\def\namesize{\huge}
\def\personalInfoSkip{\smallskip}
\def\sectionlineskip{\medskip}
\def\sectionskip{\medskip}

%----------------------------------------------------------------------------------------
%   Suppress the "missing \item" error for empty subsection bodies
%   (Formation / Certifications entries with no bullet lines)
%----------------------------------------------------------------------------------------
\def\@noitemerr{}