import { useRef } from "react";
import { describeCourse, formatMoney } from "../lib/format.js";
import courseTestCover from "../assets/course-test-cover.svg";

const SCROLL_STEP_RATIO = 0.92;

function describeCatalogSize(count) {
  return count === 1
    ? "1 curso disponivel na vitrine conectada."
    : `${count} cursos disponiveis na vitrine conectada.`;
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
              className="ghost-button ghost-button--compact course-carousel__control"
              type="button"
              onClick={() => scrollSlides(-1)}
            >
              Anterior
            </button>
            <button
              aria-label="Ver proximos cursos"
              className="ghost-button ghost-button--compact course-carousel__control"
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
        {courses.map((course) => (
          <article className="course-card course-card--featured course-carousel__slide" key={course.id}>
            <div className="course-card__media">
              <img
                alt={`Imagem ilustrativa do curso ${course.titulo}`}
                className="course-card__media-image"
                loading="lazy"
                src={courseTestCover}
              />
              <span className="course-card__media-badge">Imagem de teste</span>
            </div>
            <span className="chip">Curso</span>
            <h3>{course.titulo}</h3>
            <p>{describeCourse(course)}</p>
            <div className="course-card__footer">
              <strong>{formatMoney(course.preco)}</strong>
              <button
                className="ghost-button ghost-button--compact"
                type="button"
                onClick={() => onNavigate("/cadastro")}
              >
                Quero me matricular
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
