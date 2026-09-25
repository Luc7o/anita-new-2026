-- Vínculo opcional entre una promoción y un producto específico del
-- catálogo. ON DELETE SET NULL: si el producto se borra, la promoción NO
-- se borra con él, solo pierde la referencia (se queda con el boton_link
-- que tuviera, que puede haber quedado apuntando a un producto que ya no
-- existe — es responsabilidad del admin revisarla en ese caso).

ALTER TABLE promociones
    ADD COLUMN producto_id INT NULL,
    ADD CONSTRAINT fk_promociones_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL;
