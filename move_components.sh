#!/bin/bash
module=sps-billing
model_name=invoice
variants=()

# read folders names
for folder in $(ls -d libs/modules/$module/models/$model_name/component/variants/sps-lite/*); do
    # check is directory
    if [ -d $folder ]; then
        # get last string
        folder=${folder##*/}
        # add to variants
        variants+=($folder)
    fi
done

# echo variants: ${variants[@]}

nx reset

npx nx g @nx/workspace:move --project=@sps/$module-$model_name-api --destination=libs/modules/$module/models/$model_name/frontend/api --newProjectName=@sps/$module-$model_name-frontend-api

nx reset

npx nx g @nx/workspace:move --project=@sps/$module-$model_name-component-redux --destination=libs/modules/$module/models/$model_name/frontend/redux --newProjectName=@sps/$module-$model_name-frontend-redux


for variant in "${variants[@]}"
do
    nx reset
    npx nx g @nx/workspace:move --project=@sps/$module-$model_name-component-variants-sps-lite-$variant --destination=libs/modules/$module/models/$model_name/frontend/component/variants/sps-lite/$variant --newProjectName=@sps/$module-$model_name-frontend-component-sps-lite-variants-$variant
done

nx reset

npx nx g @nx/workspace:move --project=@sps/$module-$model_name-component --destination=libs/modules/$module/models/$model_name/frontend/component/root --newProjectName=@sps/$module-$model_name-frontend-component