#!/bin/bash

# =============================================================================
# ATELIER 430 - Helper de Fotos v1.2 (compatible bash 3.2 - Mac)
# =============================================================================

# Colores
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuración
BASE_DIR="$HOME/Documents/Atelier430-Fotos"

# Función helper para buscar archivos con cualquier extensión (case-insensitive)
# Usa find en lugar de glob para compatibilidad con bash 3.2
find_photos() {
    local folder=$1
    [ ! -d "$folder" ] && return
    find "$folder" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) 2>/dev/null
}

# Mapeos
get_prefix() {
    case $1 in
        1) echo "R" ;;
        2) echo "N" ;;
        3) echo "E" ;;
        4) echo "M" ;;
    esac
}

get_folder() {
    case $1 in
        1) echo "1-Religiosas" ;;
        2) echo "2-Nacionales" ;;
        3) echo "3-Europeas" ;;
        4) echo "4-Modernas" ;;
    esac
}

get_category_name() {
    case $1 in
        1) echo "Religiosa" ;;
        2) echo "Nacional" ;;
        3) echo "Europea" ;;
        4) echo "Moderna" ;;
    esac
}

get_expected_count() {
    case $1 in
        1) echo 77 ;;
        2) echo 220 ;;
        3) echo 96 ;;
        4) echo 41 ;;
    esac
}

# =============================================================================
# UTILIDADES
# =============================================================================

print_header() {
    clear
    echo -e "${GOLD}═══════════════════════════════════════════════════${NC}"
    echo -e "${GOLD}   🎨 Atelier 430 - Helper de Fotos v1.2${NC}"
    echo -e "${GOLD}═══════════════════════════════════════════════════${NC}"
    echo ""
}

ensure_base_dir() {
    if [ ! -d "$BASE_DIR" ]; then
        echo -e "${YELLOW}📁 Creando directorio base: $BASE_DIR${NC}"
        mkdir -p "$BASE_DIR"
        mkdir -p "$BASE_DIR/1-Religiosas"
        mkdir -p "$BASE_DIR/2-Nacionales"
        mkdir -p "$BASE_DIR/3-Europeas"
        mkdir -p "$BASE_DIR/4-Modernas"
        echo -e "${GREEN}✅ Estructura inicial creada${NC}"
        echo ""
    fi
}

format_code() {
    printf "%s-%03d" "$1" "$2"
}

# Cuenta fotos sin renombrar
count_unrenamed_photos() {
    local folder=$1
    local code=$2
    local count=0
    
    [ ! -d "$folder" ] && echo 0 && return
    
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        local basename=$(basename "$file")
        if ! echo "$basename" | grep -qE "^${code}-[0-9]+\."; then
            count=$((count + 1))
        fi
    done < <(find_photos "$folder")
    
    echo $count
}

# Cuenta fotos renombradas
count_renamed_photos() {
    local folder=$1
    local code=$2
    local count=0
    
    [ ! -d "$folder" ] && echo 0 && return
    
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        local basename=$(basename "$file")
        if echo "$basename" | grep -qE "^${code}-[0-9]+\."; then
            count=$((count + 1))
        fi
    done < <(find_photos "$folder")
    
    echo $count
}

# Renombra fotos de una carpeta
rename_folder() {
    local folder=$1
    local code=$2
    local dry_run=$3
    local renamed=0
    
    [ ! -d "$folder" ] && return 0
    
    # Lista temporal con archivos a renombrar
    local temp_list=$(mktemp)
    
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        local basename=$(basename "$file")
        if ! echo "$basename" | grep -qE "^${code}-[0-9]+\."; then
            echo "$file" >> "$temp_list"
        fi
    done < <(find_photos "$folder")
    
    # Ordenar alfabéticamente
    sort -o "$temp_list" "$temp_list"
    
    # Buscar siguiente número disponible
    local next_num=1
    while [ -f "$folder/${code}-${next_num}.jpg" ] || [ -f "$folder/${code}-${next_num}.jpeg" ] || [ -f "$folder/${code}-${next_num}.JPG" ] || [ -f "$folder/${code}-${next_num}.JPEG" ]; do
        next_num=$((next_num + 1))
    done
    
    # Renombrar
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        local extension="${file##*.}"
        # Convertir extensión a minúsculas usando tr
        extension=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
        local new_name="$folder/${code}-${next_num}.${extension}"
        
        if [ "$dry_run" = "true" ]; then
            echo -e "  ${CYAN}$(basename "$file")${NC} → ${GREEN}${code}-${next_num}.${extension}${NC}"
        else
            # -f: sin prompt; evita alias mv -i que leería stdin y rompe bucles "read <<< lista"
            mv -f "$file" "$new_name"
            echo -e "  ${GREEN}✅${NC} $(basename "$file") → ${code}-${next_num}.${extension}" >&2
        fi
        
        next_num=$((next_num + 1))
        renamed=$((renamed + 1))
    done < "$temp_list"
    
    rm -f "$temp_list"
    echo $renamed
}

press_enter() {
    echo ""
    read -p "Presiona Enter para continuar..." dummy
}

# =============================================================================
# FUNCIÓN 1: CREAR CARPETAS POR RANGO
# =============================================================================

func_create_folders() {
    print_header
    echo -e "${BOLD}📁 Crear carpetas por rango${NC}"
    echo "─────────────────────────────"
    echo ""
    echo "Selecciona categoría:"
    echo ""
    echo "  1) Religiosa (R)  - 77 obras esperadas"
    echo "  2) Nacional (N)   - 220 obras esperadas"
    echo "  3) Europea (E)    - 96 obras esperadas"
    echo "  4) Moderna (M)    - 41 obras esperadas"
    echo ""
    read -p "Selecciona (1-4): " cat_num
    
    case $cat_num in
        1|2|3|4) ;;
        *) echo -e "${RED}❌ Categoría inválida${NC}"; press_enter; return ;;
    esac
    
    local prefix=$(get_prefix $cat_num)
    local folder=$(get_folder $cat_num)
    local cat_name=$(get_category_name $cat_num)
    local expected=$(get_expected_count $cat_num)
    
    echo ""
    echo -e "Categoría: ${GREEN}$cat_name (${prefix})${NC}"
    echo ""
    read -p "Rango desde (1-$expected): " from
    read -p "Rango hasta (1-$expected): " to
    
    if ! echo "$from" | grep -qE '^[0-9]+$' || ! echo "$to" | grep -qE '^[0-9]+$'; then
        echo -e "${RED}❌ Los números deben ser válidos${NC}"
        press_enter
        return
    fi
    
    if [ "$from" -gt "$to" ]; then
        echo -e "${RED}❌ El rango 'desde' debe ser menor o igual a 'hasta'${NC}"
        press_enter
        return
    fi
    
    if [ "$to" -gt "$expected" ]; then
        echo -e "${YELLOW}⚠️  $to excede las $expected obras esperadas para $cat_name${NC}"
        read -p "¿Continuar? (s/n): " confirm
        case $confirm in
            s|S) ;;
            *) return ;;
        esac
    fi
    
    local total=$((to - from + 1))
    
    echo ""
    echo -e "${BOLD}Voy a crear $total carpetas:${NC}"
    
    if [ "$total" -le 10 ]; then
        local i=$from
        while [ $i -le $to ]; do
            local code=$(format_code "$prefix" "$i")
            echo "  📁 $folder/$code/"
            i=$((i + 1))
        done
    else
        local first_code=$(format_code "$prefix" "$from")
        local last_code=$(format_code "$prefix" "$to")
        echo "  📁 $folder/$first_code/"
        echo "  📁 $folder/... ($((total - 2)) más)"
        echo "  📁 $folder/$last_code/"
    fi
    
    echo ""
    read -p "¿Confirmas? (s/n): " confirm
    
    case $confirm in
        s|S) ;;
        *) echo -e "${YELLOW}❌ Cancelado${NC}"; press_enter; return ;;
    esac
    
    local created=0
    local skipped=0
    local i=$from
    
    while [ $i -le $to ]; do
        local code=$(format_code "$prefix" "$i")
        local full_path="$BASE_DIR/$folder/$code"
        
        if [ -d "$full_path" ]; then
            skipped=$((skipped + 1))
        else
            mkdir -p "$full_path"
            created=$((created + 1))
        fi
        i=$((i + 1))
    done
    
    echo ""
    echo -e "${GREEN}✅ $created carpetas creadas${NC}"
    [ "$skipped" -gt 0 ] && echo -e "${YELLOW}⚠️  $skipped ya existían${NC}"
    echo ""
    echo -e "Coloca las fotos en: ${BLUE}$BASE_DIR/$folder/${NC}"
    
    press_enter
}

# =============================================================================
# FUNCIÓN 2: RENOMBRAR UNA CARPETA
# =============================================================================

func_rename_single() {
    print_header
    echo -e "${BOLD}🔄 Renombrar UNA carpeta${NC}"
    echo "─────────────────────────────"
    echo ""
    echo "Ingresa el código de la carpeta (ej: R-001, N-015, E-008, M-003):"
    read -p "Código: " code
    
    if ! echo "$code" | grep -qE '^[RNEM]-[0-9]{3}$'; then
        echo -e "${RED}❌ Código inválido. Formato: R-001, N-015, E-008, M-003${NC}"
        press_enter
        return
    fi
    
    local prefix="${code:0:1}"
    local folder=""
    case $prefix in
        R) folder="1-Religiosas" ;;
        N) folder="2-Nacionales" ;;
        E) folder="3-Europeas" ;;
        M) folder="4-Modernas" ;;
    esac
    
    local full_path="$BASE_DIR/$folder/$code"
    
    if [ ! -d "$full_path" ]; then
        echo -e "${RED}❌ La carpeta $full_path no existe${NC}"
        press_enter
        return
    fi
    
    local unrenamed=$(count_unrenamed_photos "$full_path" "$code")
    local renamed=$(count_renamed_photos "$full_path" "$code")
    
    echo ""
    echo -e "Carpeta: ${BLUE}$full_path${NC}"
    echo -e "Ya renombradas: ${GREEN}$renamed${NC}"
    echo -e "Pendientes: ${YELLOW}$unrenamed${NC}"
    
    if [ "$unrenamed" -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Esta carpeta ya está completamente renombrada${NC}"
        press_enter
        return
    fi
    
    echo ""
    echo "Vista previa:"
    rename_folder "$full_path" "$code" "true"
    
    echo ""
    read -p "¿Aplicar renombrado? (s/n): " confirm
    
    case $confirm in
        s|S)
            echo ""
            local count=$(rename_folder "$full_path" "$code" "false" </dev/null)
            echo ""
            echo -e "${GREEN}✅ $count fotos renombradas${NC}"
            ;;
        *)
            echo -e "${YELLOW}❌ Cancelado${NC}"
            ;;
    esac
    
    press_enter
}

# =============================================================================
# FUNCIÓN 3: RENOMBRAR MASIVAMENTE
# =============================================================================

func_rename_mass() {
    print_header
    echo -e "${BOLD}🚀 Renombrar MASIVAMENTE${NC}"
    echo "─────────────────────────────"
    echo ""
    echo "  1) Por rango (ej: R-001 a R-020)"
    echo "  2) Toda una categoría"
    echo "  3) TODAS las carpetas con fotos pendientes"
    echo "  0) Volver"
    echo ""
    read -p "Selecciona: " mode
    
    case $mode in
        1) rename_by_range ;;
        2) rename_by_category ;;
        3) rename_all_pending ;;
        0) return ;;
        *) echo -e "${RED}❌ Opción inválida${NC}"; press_enter ;;
    esac
}

rename_by_range() {
    echo ""
    echo "Categoría:"
    echo "  1) Religiosa  2) Nacional  3) Europea  4) Moderna"
    read -p "Selecciona (1-4): " cat_num
    
    case $cat_num in
        1|2|3|4) ;;
        *) echo -e "${RED}❌ Inválido${NC}"; press_enter; return ;;
    esac
    
    local prefix=$(get_prefix $cat_num)
    local folder=$(get_folder $cat_num)
    
    echo ""
    read -p "Desde: " from
    read -p "Hasta: " to
    
    if ! echo "$from" | grep -qE '^[0-9]+$' || ! echo "$to" | grep -qE '^[0-9]+$' || [ "$from" -gt "$to" ]; then
        echo -e "${RED}❌ Rango inválido${NC}"
        press_enter
        return
    fi
    
    echo ""
    echo "🔍 Detectando carpetas con fotos pendientes..."
    echo ""
    
    local total_pending=0
    local folders_list=""
    local i=$from
    
    while [ $i -le $to ]; do
        local code=$(format_code "$prefix" "$i")
        local full_path="$BASE_DIR/$folder/$code"
        
        if [ ! -d "$full_path" ]; then
            echo -e "  ${YELLOW}⚠️  $code: carpeta no existe${NC}"
        else
            local unrenamed=$(count_unrenamed_photos "$full_path" "$code")
            
            if [ "$unrenamed" -gt 0 ]; then
                echo -e "  ${GREEN}✅ $code: $unrenamed fotos pendientes${NC}"
                folders_list="${folders_list}${full_path}|${code}"$'\n'
                total_pending=$((total_pending + unrenamed))
            else
                local renamed=$(count_renamed_photos "$full_path" "$code")
                if [ "$renamed" -eq 0 ]; then
                    echo -e "  ${YELLOW}⚪ $code: vacía${NC}"
                else
                    echo -e "  ${BLUE}✓ $code: ya renombrada ($renamed fotos)${NC}"
                fi
            fi
        fi
        i=$((i + 1))
    done
    
    if [ -z "$folders_list" ]; then
        echo ""
        echo -e "${YELLOW}No hay fotos pendientes en este rango${NC}"
        press_enter
        return
    fi
    
    local folder_count=$(echo "$folders_list" | grep -c "|")
    
    echo ""
    echo -e "${BOLD}Resumen: $folder_count carpetas, $total_pending fotos${NC}"
    echo ""
    read -p "¿Continuar? (s/n): " confirm
    
    case $confirm in
        s|S) ;;
        *) echo -e "${YELLOW}❌ Cancelado${NC}"; press_enter; return ;;
    esac
    
    echo ""
    local total_renamed=0
    
    while IFS='|' read -r fpath fcode; do
        [ -z "$fpath" ] && continue
        echo -e "${CYAN}Procesando $fcode...${NC}"
        local count=$(rename_folder "$fpath" "$fcode" "false" </dev/null)
        total_renamed=$((total_renamed + count))
    done <<< "$folders_list"
    
    echo ""
    echo -e "${GREEN}✅ $folder_count carpetas procesadas, $total_renamed fotos renombradas${NC}"
    
    press_enter
}

rename_by_category() {
    echo ""
    echo "Categoría:"
    echo "  1) Religiosa  2) Nacional  3) Europea  4) Moderna"
    read -p "Selecciona (1-4): " cat_num
    
    case $cat_num in
        1|2|3|4) ;;
        *) echo -e "${RED}❌ Inválido${NC}"; press_enter; return ;;
    esac
    
    local prefix=$(get_prefix $cat_num)
    local folder=$(get_folder $cat_num)
    local cat_name=$(get_category_name $cat_num)
    local cat_path="$BASE_DIR/$folder"
    
    echo ""
    echo "🔍 Buscando en $cat_name..."
    echo ""
    
    local total_pending=0
    local folders_list=""
    local folder_count=0
    
    while IFS= read -r dir; do
        [ -z "$dir" ] && continue
        local code=$(basename "$dir")
        local unrenamed=$(count_unrenamed_photos "$dir" "$code")
        
        if [ "$unrenamed" -gt 0 ]; then
            folders_list="${folders_list}${dir}|${code}|${unrenamed}"$'\n'
            total_pending=$((total_pending + unrenamed))
            folder_count=$((folder_count + 1))
        fi
    done < <(find "$cat_path" -maxdepth 1 -type d -name "${prefix}-*" 2>/dev/null | sort)
    
    if [ "$folder_count" -eq 0 ]; then
        echo -e "${YELLOW}No hay fotos pendientes en $cat_name${NC}"
        press_enter
        return
    fi
    
    echo "Encontradas $folder_count carpetas con fotos pendientes:"
    
    local count=0
    while IFS='|' read -r fpath fcode fcount; do
        [ -z "$fpath" ] && continue
        echo -e "  ${GREEN}📁 $fcode${NC} ($fcount fotos)"
        count=$((count + 1))
        if [ "$count" -ge 15 ]; then
            local remaining=$((folder_count - 15))
            [ "$remaining" -gt 0 ] && echo -e "  ${BLUE}... y $remaining más${NC}"
            break
        fi
    done <<< "$folders_list"
    
    echo ""
    echo -e "${BOLD}Total: $folder_count carpetas, $total_pending fotos${NC}"
    echo ""
    read -p "¿Procesar todas? (s/n): " confirm
    
    case $confirm in
        s|S) ;;
        *) echo -e "${YELLOW}❌ Cancelado${NC}"; press_enter; return ;;
    esac
    
    echo ""
    local total_renamed=0
    local processed=0
    
    while IFS='|' read -r fpath fcode fcount; do
        [ -z "$fpath" ] && continue
        processed=$((processed + 1))
        printf "${CYAN}[%d/%d] %s...${NC}\r" "$processed" "$folder_count" "$fcode"
        local count=$(rename_folder "$fpath" "$fcode" "false" </dev/null)
        total_renamed=$((total_renamed + count))
    done <<< "$folders_list"
    
    echo ""
    echo ""
    echo -e "${GREEN}✅ $folder_count carpetas procesadas, $total_renamed fotos renombradas${NC}"
    
    press_enter
}

rename_all_pending() {
    echo ""
    echo "🔍 Detectando TODAS las carpetas con fotos pendientes..."
    echo ""
    
    local total_pending=0
    local folders_list=""
    local folder_count=0
    local r_count=0; local n_count=0; local e_count=0; local m_count=0
    local r_photos=0; local n_photos=0; local e_photos=0; local m_photos=0
    
    for cat_num in 1 2 3 4; do
        local prefix=$(get_prefix $cat_num)
        local folder=$(get_folder $cat_num)
        local cat_path="$BASE_DIR/$folder"
        
        while IFS= read -r dir; do
            [ -z "$dir" ] && continue
            local code=$(basename "$dir")
            local unrenamed=$(count_unrenamed_photos "$dir" "$code")
            
            if [ "$unrenamed" -gt 0 ]; then
                folders_list="${folders_list}${dir}|${code}|${unrenamed}"$'\n'
                total_pending=$((total_pending + unrenamed))
                folder_count=$((folder_count + 1))
                
                case $prefix in
                    R) r_count=$((r_count + 1)); r_photos=$((r_photos + unrenamed)) ;;
                    N) n_count=$((n_count + 1)); n_photos=$((n_photos + unrenamed)) ;;
                    E) e_count=$((e_count + 1)); e_photos=$((e_photos + unrenamed)) ;;
                    M) m_count=$((m_count + 1)); m_photos=$((m_photos + unrenamed)) ;;
                esac
            fi
        done < <(find "$cat_path" -maxdepth 1 -type d -name "${prefix}-*" 2>/dev/null | sort)
    done
    
    if [ "$folder_count" -eq 0 ]; then
        echo -e "${YELLOW}No hay fotos pendientes en ninguna categoría${NC}"
        press_enter
        return
    fi
    
    echo "Encontradas $folder_count carpetas con fotos pendientes"
    echo ""
    echo "Resumen por categoría:"
    [ "$r_count" -gt 0 ] && echo -e "  ${GREEN}🙏 Religiosas:${NC} $r_count carpetas, $r_photos fotos"
    [ "$n_count" -gt 0 ] && echo -e "  ${GREEN}🏞️  Nacionales:${NC} $n_count carpetas, $n_photos fotos"
    [ "$e_count" -gt 0 ] && echo -e "  ${GREEN}🎭 Europeas:${NC} $e_count carpetas, $e_photos fotos"
    [ "$m_count" -gt 0 ] && echo -e "  ${GREEN}🎨 Modernas:${NC} $m_count carpetas, $m_photos fotos"
    
    echo ""
    echo -e "${BOLD}TOTAL: $folder_count carpetas, $total_pending fotos${NC}"
    echo ""
    read -p "¿Procesar TODAS? (s/n): " confirm
    
    case $confirm in
        s|S) ;;
        *) echo -e "${YELLOW}❌ Cancelado${NC}"; press_enter; return ;;
    esac
    
    echo ""
    local total_renamed=0
    local processed=0
    
    while IFS='|' read -r fpath fcode fcount; do
        [ -z "$fpath" ] && continue
        processed=$((processed + 1))
        printf "${CYAN}[%d/%d] %s...${NC}\r" "$processed" "$folder_count" "$fcode"
        local count=$(rename_folder "$fpath" "$fcode" "false" </dev/null)
        total_renamed=$((total_renamed + count))
    done <<< "$folders_list"
    
    echo ""
    echo ""
    echo -e "${GREEN}✅ $folder_count carpetas procesadas, $total_renamed fotos renombradas${NC}"
    
    press_enter
}

# =============================================================================
# FUNCIÓN 4: VALIDAR
# =============================================================================

func_validate() {
    print_header
    echo -e "${BOLD}✅ Validar naming${NC}"
    echo "─────────────────────────────"
    echo ""
    echo "🔍 Analizando..."
    echo ""
    
    local total_folders=0
    local total_photos=0
    local total_unrenamed=0
    local errors=0
    local warnings=0
    local error_list=""
    local warning_list=""
    
    for cat_num in 1 2 3 4; do
        local prefix=$(get_prefix $cat_num)
        local folder=$(get_folder $cat_num)
        local cat_name=$(get_category_name $cat_num)
        local cat_path="$BASE_DIR/$folder"
        
        local cat_folders=0
        local cat_photos=0
        local cat_with_main=0
        
        while IFS= read -r dir; do
            [ -z "$dir" ] && continue
            local code=$(basename "$dir")
            cat_folders=$((cat_folders + 1))
            total_folders=$((total_folders + 1))
            
            local renamed=$(count_renamed_photos "$dir" "$code")
            local unrenamed=$(count_unrenamed_photos "$dir" "$code")
            local total=$((renamed + unrenamed))
            
            cat_photos=$((cat_photos + renamed))
            total_photos=$((total_photos + renamed))
            total_unrenamed=$((total_unrenamed + unrenamed))
            
            if [ "$renamed" -gt 0 ]; then
                if [ -f "$dir/${code}-1.jpg" ] || [ -f "$dir/${code}-1.jpeg" ] || [ -f "$dir/${code}-1.JPG" ] || [ -f "$dir/${code}-1.JPEG" ]; then
                    cat_with_main=$((cat_with_main + 1))
                else
                    error_list="${error_list}${code}: no tiene foto principal (-1)"$'\n'
                    errors=$((errors + 1))
                fi
            fi
            
            if [ "$total" -eq 0 ]; then
                warning_list="${warning_list}${code}: carpeta vacía"$'\n'
                warnings=$((warnings + 1))
            fi
            
            if [ "$renamed" -gt 5 ]; then
                warning_list="${warning_list}${code}: $renamed fotos (recomendado max 5)"$'\n'
                warnings=$((warnings + 1))
            fi
            
            if [ "$unrenamed" -gt 0 ]; then
                error_list="${error_list}${code}: $unrenamed fotos sin renombrar"$'\n'
                errors=$((errors + 1))
            fi
        done < <(find "$cat_path" -maxdepth 1 -type d -name "${prefix}-*" 2>/dev/null | sort)
        
        if [ "$cat_folders" -gt 0 ]; then
            echo -e "${BOLD}$cat_name:${NC} $cat_folders carpetas, $cat_photos fotos, $cat_with_main con principal"
        fi
    done
    
    echo ""
    echo "─────────────────────────────"
    echo -e "Total carpetas: ${BLUE}$total_folders${NC}"
    echo -e "Total fotos renombradas: ${GREEN}$total_photos${NC}"
    [ "$total_unrenamed" -gt 0 ] && echo -e "Sin renombrar: ${YELLOW}$total_unrenamed${NC}"
    echo "─────────────────────────────"
    
    if [ "$errors" -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ Errores ($errors):${NC}"
        local count=0
        while IFS= read -r err; do
            [ -z "$err" ] && continue
            echo -e "  ${RED}•${NC} $err"
            count=$((count + 1))
            if [ "$count" -ge 10 ]; then
                echo -e "  ${RED}...y más${NC}"
                break
            fi
        done <<< "$error_list"
    fi
    
    if [ "$warnings" -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Advertencias ($warnings):${NC}"
        local count=0
        while IFS= read -r warn; do
            [ -z "$warn" ] && continue
            echo -e "  ${YELLOW}•${NC} $warn"
            count=$((count + 1))
            if [ "$count" -ge 10 ]; then
                echo -e "  ${YELLOW}...y más${NC}"
                break
            fi
        done <<< "$warning_list"
    fi
    
    echo ""
    if [ "$errors" -eq 0 ]; then
        echo -e "${GREEN}✅ Validación OK - listo para crear ZIP${NC}"
    else
        echo -e "${RED}❌ Hay errores que resolver${NC}"
    fi
    
    press_enter
}

# =============================================================================
# FUNCIÓN 5: CREAR ZIP
# =============================================================================

func_create_zip() {
    print_header
    echo -e "${BOLD}📦 Crear ZIP final${NC}"
    echo "─────────────────────────────"
    echo ""
    echo "🔍 Validando..."
    
    local total_photos=0
    local has_errors=false
    
    for cat_num in 1 2 3 4; do
        local prefix=$(get_prefix $cat_num)
        local folder=$(get_folder $cat_num)
        local cat_path="$BASE_DIR/$folder"
        
        while IFS= read -r dir; do
            [ -z "$dir" ] && continue
            local code=$(basename "$dir")
            local unrenamed=$(count_unrenamed_photos "$dir" "$code")
            local renamed=$(count_renamed_photos "$dir" "$code")
            
            total_photos=$((total_photos + renamed))
            [ "$unrenamed" -gt 0 ] && has_errors=true
        done < <(find "$cat_path" -maxdepth 1 -type d -name "${prefix}-*" 2>/dev/null)
    done
    
    if [ "$has_errors" = "true" ]; then
        echo ""
        echo -e "${RED}❌ Hay fotos sin renombrar. Usa la opción 3 primero.${NC}"
        press_enter
        return
    fi
    
    if [ "$total_photos" -eq 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  No hay fotos renombradas${NC}"
        press_enter
        return
    fi
    
    echo ""
    echo -e "Total a incluir: ${GREEN}$total_photos fotos${NC}"
    
    local temp_dir=$(mktemp -d)
    local zip_name="Atelier430-Fotos-$(date +%Y-%m-%d).zip"
    local zip_path="$BASE_DIR/$zip_name"
    
    echo ""
    echo "📋 Copiando archivos..."
    local copied=0
    
    for cat_num in 1 2 3 4; do
        local prefix=$(get_prefix $cat_num)
        local folder=$(get_folder $cat_num)
        local cat_path="$BASE_DIR/$folder"
        
        while IFS= read -r dir; do
            [ -z "$dir" ] && continue
            local code=$(basename "$dir")
            
            while IFS= read -r file; do
                [ -z "$file" ] && continue
                local basename=$(basename "$file")
                if echo "$basename" | grep -qE "^${code}-[0-9]+\."; then
                    cp "$file" "$temp_dir/"
                    copied=$((copied + 1))
                    printf "  Copiando... %d/%d\r" "$copied" "$total_photos"
                fi
            done < <(find_photos "$dir")
        done < <(find "$cat_path" -maxdepth 1 -type d -name "${prefix}-*" 2>/dev/null)
    done
    
    echo ""
    echo "🗜️  Comprimiendo..."
    
    cd "$temp_dir"
    zip -q -r "$zip_path" . -x "*.DS_Store"
    cd - > /dev/null
    
    rm -rf "$temp_dir"
    
    if [ -f "$zip_path" ]; then
        local size=$(du -h "$zip_path" | cut -f1)
        echo ""
        echo -e "${GREEN}✅ ZIP creado${NC}"
        echo ""
        echo -e "📁 Ubicación: ${BLUE}$zip_path${NC}"
        echo -e "📦 Tamaño: ${BLUE}$size${NC}"
        echo -e "📸 Fotos: ${BLUE}$total_photos${NC}"
        echo ""
        echo -e "${GOLD}Listo para subir a /admin/obras/importar${NC}"
    else
        echo -e "${RED}❌ Error al crear el ZIP${NC}"
    fi
    
    press_enter
}

# =============================================================================
# FUNCIÓN 6: ESTADÍSTICAS
# =============================================================================

func_stats() {
    print_header
    echo -e "${BOLD}📊 Estadísticas${NC}"
    echo "─────────────────────────────"
    echo ""
    
    local grand_total_obras=0
    local grand_total_fotos=0
    local grand_total_pending=0
    
    for cat_num in 1 2 3 4; do
        local prefix=$(get_prefix $cat_num)
        local folder=$(get_folder $cat_num)
        local cat_name=$(get_category_name $cat_num)
        local cat_path="$BASE_DIR/$folder"
        local expected=$(get_expected_count $cat_num)
        
        local cat_folders=0
        local cat_with_photos=0
        local cat_renamed=0
        local cat_pending=0
        
        while IFS= read -r dir; do
            [ -z "$dir" ] && continue
            cat_folders=$((cat_folders + 1))
            
            local code=$(basename "$dir")
            local renamed=$(count_renamed_photos "$dir" "$code")
            local unrenamed=$(count_unrenamed_photos "$dir" "$code")
            
            if [ $((renamed + unrenamed)) -gt 0 ]; then
                cat_with_photos=$((cat_with_photos + 1))
            fi
            
            cat_renamed=$((cat_renamed + renamed))
            cat_pending=$((cat_pending + unrenamed))
        done < <(find "$cat_path" -maxdepth 1 -type d -name "${prefix}-*" 2>/dev/null)
        
        local pct=0
        [ "$expected" -gt 0 ] && pct=$((cat_with_photos * 100 / expected))
        
        local bar=""
        local filled=$((pct / 5))
        local i=0
        while [ $i -lt 20 ]; do
            if [ $i -lt $filled ]; then
                bar="${bar}█"
            else
                bar="${bar}░"
            fi
            i=$((i + 1))
        done
        
        echo -e "${BOLD}$cat_name${NC} ($prefix-XXX)"
        echo -e "  Carpetas: ${BLUE}$cat_folders${NC} / $expected esperadas"
        echo -e "  Con fotos: ${GREEN}$cat_with_photos${NC} ($pct%)"
        echo -e "  $bar"
        echo -e "  Fotos renombradas: ${GREEN}$cat_renamed${NC}"
        [ "$cat_pending" -gt 0 ] && echo -e "  ${YELLOW}Pendientes: $cat_pending${NC}"
        echo ""
        
        grand_total_obras=$((grand_total_obras + cat_with_photos))
        grand_total_fotos=$((grand_total_fotos + cat_renamed))
        grand_total_pending=$((grand_total_pending + cat_pending))
    done
    
    local grand_pct=$((grand_total_obras * 100 / 430))
    
    echo "═════════════════════════════"
    echo -e "${BOLD}TOTAL${NC}"
    echo -e "  Obras procesadas: ${GREEN}$grand_total_obras${NC} / 430 ($grand_pct%)"
    echo -e "  Fotos renombradas: ${GREEN}$grand_total_fotos${NC}"
    [ "$grand_total_pending" -gt 0 ] && echo -e "  ${YELLOW}Pendientes: $grand_total_pending${NC}"
    
    press_enter
}

# =============================================================================
# MENÚ PRINCIPAL
# =============================================================================

show_menu() {
    print_header
    
    local total_pending=0
    local total_renamed=0
    
    for cat_num in 1 2 3 4; do
        local prefix=$(get_prefix $cat_num)
        local folder=$(get_folder $cat_num)
        local cat_path="$BASE_DIR/$folder"
        
        while IFS= read -r dir; do
            [ -z "$dir" ] && continue
            local code=$(basename "$dir")
            local renamed=$(count_renamed_photos "$dir" "$code")
            local unrenamed=$(count_unrenamed_photos "$dir" "$code")
            total_renamed=$((total_renamed + renamed))
            total_pending=$((total_pending + unrenamed))
        done < <(find "$cat_path" -maxdepth 1 -type d -name "${prefix}-*" 2>/dev/null)
    done
    
    echo -e "📊 Estado: ${GREEN}$total_renamed${NC} renombradas, ${YELLOW}$total_pending${NC} pendientes"
    echo ""
    echo -e "${BOLD}¿Qué quieres hacer?${NC}"
    echo ""
    echo "  1) 📁 Crear carpetas (rango de obras)"
    echo "  2) 🔄 Renombrar UNA carpeta"
    echo "  3) 🚀 Renombrar MASIVAMENTE"
    echo "  4) ✅ Validar naming"
    echo "  5) 📦 Crear ZIP final"
    echo "  6) 📊 Ver estadísticas"
    echo "  0) Salir"
    echo ""
    read -p "Selecciona: " choice
    
    case $choice in
        1) func_create_folders ;;
        2) func_rename_single ;;
        3) func_rename_mass ;;
        4) func_validate ;;
        5) func_create_zip ;;
        6) func_stats ;;
        0) 
            echo ""
            echo -e "${GOLD}¡Hasta pronto, Rick! 🎨${NC}"
            echo ""
            exit 0 
            ;;
        *) 
            echo -e "${RED}❌ Opción inválida${NC}"
            press_enter
            ;;
    esac
}

# =============================================================================
# MAIN
# =============================================================================

if ! command -v zip &> /dev/null; then
    echo -e "${RED}❌ El comando 'zip' no está instalado${NC}"
    exit 1
fi

ensure_base_dir

while true; do
    show_menu
done