
#Comandos Angular 19 (standalone)

ng g c components/pages/login --standalone
ng g c components/layout/main-layout --standalone
ng g c components/layout/sidebar --standalone

#Crear servicios: AuthService + TokenStorage + Guard + Interceptor

ng g s core/auth/auth --skip-tests
ng g s core/auth/token-storage --skip-tests
ng g guard core/auth/auth --functional --skip-tests
ng g interceptor core/http/auth-token --functional --skip-tests

ng g c components/pages/distritos/distritos --standalone --style css --skip-tests

ng g service services/distritos

ng g service services/distritos --skip-tests

ng g s services/ui-state --skip-tests

ng g c components/pages/mapa --standalone --skip-tests
ng g c components/pages/control-capas --standalone --skip-tests
ng g c components/pages/map-modal-reporte-mapa --standalone --skip-tests

npm i leaflet

ng g s services/map --skip-tests

ng g c components/shared/distrito-multiselect --standalone --skip-tests

npm install chart.js

ng g c components/pages/widgets/map-modal-reporte-mapa





