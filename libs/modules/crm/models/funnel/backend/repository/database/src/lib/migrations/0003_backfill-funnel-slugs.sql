DO $$
DECLARE
  funnel record;
  replacement text[];
  base text;
  candidate text;
  suffix bigint;
BEGIN
  FOR funnel IN
    SELECT id, store_id, name
    FROM sps_cm_funnel
    WHERE slug IS NULL
    ORDER BY created_at, id
  LOOP
    base := lower(funnel.name);
    FOREACH replacement SLICE 1 IN ARRAY ARRAY[
      ['ж', 'zh'], ['ч', 'ch'], ['ш', 'sh'], ['щ', 'sh'],
      ['ю', 'yu'], ['я', 'ya'], ['ё', 'yo'], ['ь', '']
    ] LOOP
      base := replace(base, replacement[1], replacement[2]);
    END LOOP;
    base := translate(
      base,
      'абвгдезийклмнопрстуфхцъыэ',
      'abvgdezijklmnoprstufhcuye'
    );
    base := regexp_replace(normalize(base, NFKD), U&'[\0300-\036f]', '', 'g');
    base := trim(both '-' from left(regexp_replace(base, '[^a-z0-9]+', '-', 'g'), 150));
    IF base = 'new' THEN
      base := 'new-funnel';
    ELSIF base = '' THEN
      base := 'funnel';
    END IF;

    candidate := base;
    suffix := 2;
    WHILE EXISTS (
      SELECT 1 FROM sps_cm_funnel
      WHERE store_id = funnel.store_id AND slug = candidate
    ) LOOP
      candidate := base || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    UPDATE sps_cm_funnel SET slug = candidate WHERE id = funnel.id;
  END LOOP;
END $$;
