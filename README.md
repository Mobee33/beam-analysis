# Comprehensive Beam Analysis Tool 🏗️

## Overview

This web application provides a tool for visualizing and analyzing various beam loading and support conditions. Users can select from 32 different standard beam cases, adjust load parameters, and instantly see the corresponding:

*   **Visual representation of the beam, supports, and loads.**
*   **Shear Force Diagram (SFD).**
*   **Bending Moment Diagram (BMD).**
*   **Relevant governing equations.**

The tool is designed for students, engineers, and anyone interested in structural mechanics and beam theory.

## Features

*   **32 Standard Beam Cases:** Covers a wide range of configurations including:
    *   Simple Beams
    *   Cantilever Beams
    *   Overhanging Beams
    *   Propped Cantilevers
    *   Fixed-End Beams
    *   Continuous Beams (Two Spans)
*   **Interactive Parameter Adjustment:** Users can modify load magnitudes (P, w), lengths (ℓ, a, b, c), and other relevant parameters for each case.
*   **Dynamic Visuals:** An SVG-based diagram of the beam setup updates in real-time as parameters are changed.
*   **Shear Force and Bending Moment Diagrams:** Generated using Chart.js for clear and interactive plots.
*   **Equation Display:** Shows the key formulas used for calculating reactions, shear, and moment for the selected case.
*   **Modern & User-Friendly Interface:** Clean design for ease of use.
*   **Client-Side Calculation:** All calculations and rendering are done in the browser using JavaScript.

## Technologies Used

*   **HTML5:** Structure of the web page.
*   **CSS3:** Styling and layout, including responsive design elements.
*   **JavaScript (ES6+):** Core application logic, calculations, dynamic UI updates, and SVG manipulation.
*   **Chart.js:** For rendering interactive Shear Force and Bending Moment diagrams.
*   **SVG (Scalable Vector Graphics):** For drawing the beam, supports, and load visuals.

## Project Structure

The project is organized into the following key files:

*   `index.html`: The main HTML file that structures the application.
*   `styles.css`: Contains all the CSS rules for styling the application.
*   `beam_data.js`: A crucial JavaScript file holding the data objects for all 32 beam cases. This includes:
    *   Unique ID and title for each case.
    *   Definitions of adjustable parameters (name, label, default value, unit).
    *   Governing equations (as strings with HTML for formatting).
    *   `plotConfig` functions to calculate data points for SFD and BMD.
*   `beam_visualizer.js`: Contains JavaScript helper functions for drawing SVG elements and the specific visualizer functions for each of the 32 beam cases.
*   `main_app.js`: The main JavaScript file that ties everything together. It handles:
    *   UI initialization (populating dropdowns).
    *   Event listeners for user interactions.
    *   Dynamic generation of parameter input fields.
    *   Calling visualizer functions.
    *   Instantiating and updating Chart.js diagrams.
    *   Displaying equations.

## How to Run

1.  Clone this repository or download the files.
2.  Ensure all files (`index.html`, `styles.css`, `beam_data.js`, `beam_visualizer.js`, `main_app.js`) are in the same directory.
3.  Open `index.html` in a modern web browser (e.g., Chrome, Firefox, Edge, Safari).

No server-side setup is required as this is a purely client-side application.

## Usage

1.  **Select a Beam Condition:** Choose one of the 32 beam types from the dropdown menu.
2.  **Adjust Load Parameters:** Input fields for the relevant loads and dimensions for the selected beam will appear. Modify these values as needed.
3.  **Update:** Click the "Update Diagrams & Visual" button.
4.  **View Results:**
    *   The visual representation of the beam will update.
    *   The Shear Force Diagram (SFD) and Bending Moment Diagram (BMD) will be re-plotted.
    *   The relevant equations for the selected case will be displayed.

## Notes on Diagrams

*   **Shear Force Diagrams (SFD):** Plotted according to standard conventions.
*   **Bending Moment Diagrams (BMD):**
    *   For simple beams, cantilevers, and overhanging beams (approx. Figures 1-22), the moment diagrams are plotted "inverted" relative to some textbook conventions (e.g., sagging moments might be shown as negative). This was an initial design choice.
    *   For fixed-end and continuous beams (approx. Figures 23-32), the moment diagrams adhere to the standard structural engineering sign convention where hogging moments (typically at fixed ends or over intermediate supports) are plotted as negative.

## Future Enhancements (Potential)

*   Interactive dragging of loads/supports on the visual diagram.
*   Calculation and display of deflections.
*   Export options for diagrams (e.g., as PNG).
*   Unit selection (e.g., metric/imperial).
*   More detailed error handling and input validation.
*   Support for additional beam types or loading conditions.

## License

This project is for educational and demonstrative purposes. Feel free to use and modify the code. If you plan to use it for commercial purposes, please consider the licenses of any third-party libraries (like Chart.js).
