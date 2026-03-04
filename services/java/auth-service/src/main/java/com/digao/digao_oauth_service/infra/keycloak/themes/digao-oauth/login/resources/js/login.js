document.addEventListener("DOMContentLoaded", function() {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem("digao-theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = storedTheme ? storedTheme : (prefersDark ? "dark" : "light");

    root.setAttribute("data-theme", initialTheme);

    const themeToggle = document.querySelector(".digao-theme-toggle");
    const themeText = themeToggle ? themeToggle.querySelector(".digao-theme-text") : null;
    const themeIcon = themeToggle ? themeToggle.querySelector(".digao-theme-icon") : null;

    const updateThemeLabel = () => {
        const isDark = root.getAttribute("data-theme") === "dark";
        if (themeToggle) {
            themeToggle.setAttribute("aria-pressed", isDark);
        }
        if (themeText) {
            themeText.textContent = isDark ? "Modo claro" : "Modo escuro";
        }
        if (themeIcon) {
            themeIcon.textContent = isDark ? "☀" : "🌙";
        }
    };

    updateThemeLabel();

    if (themeToggle) {
        themeToggle.addEventListener("click", function(e) {
            e.preventDefault();
            const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
            root.setAttribute("data-theme", nextTheme);
            localStorage.setItem("digao-theme", nextTheme);
            updateThemeLabel();
        });
    }

    // Busca todos os botões de toggle (login, nova senha, confirmar senha)
    const toggleButtons = document.querySelectorAll(".digao-pwd-toggle");

    toggleButtons.forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.preventDefault();

            // Acha o input que está no mesmo pai (div .digao-password)
            const wrapper = btn.closest(".digao-password");
            const input = wrapper.querySelector("input");

            if (!input) return;

            const isPassword = input.getAttribute("type") === "password";
            input.setAttribute("type", isPassword ? "text" : "password");

            btn.textContent = isPassword ? "Ocultar" : "Mostrar";
            btn.setAttribute("aria-pressed", !isPassword);
        });
    });
});
