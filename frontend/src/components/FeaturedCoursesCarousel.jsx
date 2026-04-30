import { useRef } from "react";
import courseArchitectureCover from "../assets/course-arquitetura-soft.jpg";
import courseAutomationTestingCover from "../assets/course-automacao-teste.jpg";
import courseDataScienceCover from "../assets/course-ciencia-dados.jpg";
import { describeCourse, formatMoney } from "../lib/format.js";
import courseCyberSecurityCover from "../assets/course-cyber-sec.png";
import courseDevopsCloudCover from "../assets/course-devops-cloud.jpg";
import courseMobileReactCover from "../assets/course-mobile-react.jpg";
import coursePromptEngineeringCover from "../assets/course-eng-ia.png";
import coursePythonCover from "../assets/couse-python.jpg";
import courseTestCover from "../assets/course-test-cover.svg";
import courseUxDigitalCover from "../assets/course-ux-digitais.jpg";
import courseWebFullstackCover from "../assets/course-web-fullstack.png";

const SCROLL_STEP_RATIO = 0.92;
const COURSE_COVERS_BY_TITLE = {
  "arquitetura de software moderna": courseArchitectureCover,
  "ciencia de dados aplicada": courseDataScienceCover,
  "cyberseguranca para aplicacoes web": courseCyberSecurityCover,
  "desenvolvimento web full stack": courseWebFullstackCover,
  "devops e cloud foundations": courseDevopsCloudCover,
  "engenharia de prompt e ia generativa": coursePromptEngineeringCover,
  "mobile com react native": courseMobileReactCover,
  "python para automacao e dados": coursePythonCover,
  "qa e automacao de testes": courseAutomationTestingCover,
  "ux para produtos digitais": courseUxDigitalCover
};

function describeCatalogSize(count) {
  return count === 1
    ? "1 curso disponivel para matricula."
    : `${count} cursos disponiveis para matricula.`;
}

export default function FeaturedCoursesCarousel({ courses, onNavigate }) {
  const viewportRef = useRef(null);

  function scrollSlides(direction) {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollBy({
      left: viewport.clientWidth * SCROLL_STEP_RATIO * direction,
      behavior: "smooth"
    });
  }

  return (
    <div className="course-carousel">
      <div className="course-carousel__toolbar">
        <p className="course-carousel__summary">{describeCatalogSize(courses.length)}</p>

        {courses.length > 1 ? (
          <div className="course-carousel__actions">
            <button
              aria-label="Ver cursos anteriores"
              className="button button--secondary button--compact course-carousel__control"
              type="button"
              onClick={() => scrollSlides(-1)}
            >
              Anterior
            </button>
            <button
              aria-label="Ver proximos cursos"
              className="button button--secondary button--compact course-carousel__control"
              type="button"
              onClick={() => scrollSlides(1)}
            >
              Proximo
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={viewportRef}
        aria-label="Catalogo de cursos"
        className="course-carousel__viewport"
        tabIndex={0}
      >
        {courses.map((course) => {
          const courseCover = getCourseCover(course);

          return (
            <article className="course-card course-card--featured course-carousel__slide" key={course.id}>
              <div className="course-card__media">
                <img
                  alt={`Imagem ilustrativa do curso ${course.titulo}`}
                  className="course-card__media-image"
                  loading="lazy"
                  src={courseCover}
                />
              </div>
              <span className="chip">Curso</span>
              <h3>{course.titulo}</h3>
              <p>{describeCourse(course)}</p>
              <div className="course-card__footer">
                <strong>{formatMoney(course.preco)}</strong>
                <button
                  className="button button--secondary button--compact"
                  type="button"
                  onClick={() => onNavigate("/cadastro")}
                >
                  Quero me matricular
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function getCourseCover(course) {
  const title = String(course.titulo || "").trim().toLowerCase();

  return COURSE_COVERS_BY_TITLE[title] || courseTestCover;
}
