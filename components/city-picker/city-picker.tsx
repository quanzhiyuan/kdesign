import React, { useContext, useRef, useEffect, useState, useCallback } from 'react'
import { useMergedState } from '../_utils/hooks'
import classNames from 'classnames'
import ConfigContext from '../config-provider/ConfigContext'
import { getCompProps } from '../_utils'
import { Icon, Tabs, Spin } from '../index'
import { CityPickerProps, CityList, Type, City } from './interface'
import usePopper from '../_utils/usePopper'
import Option from './option'
import escapeRegExp from 'lodash/escapeRegExp'

const tabsData = [
  { id: 'domestic', name: '国内' },
  { id: 'foreign', name: '国际/中国港澳台' },
]

const InternalSelect: React.ForwardRefRenderFunction<CityPickerProps> = (props: any, ref: unknown) => {
  const { getPrefixCls, prefixCls, compDefaultProps: userDefaultProps } = useContext(ConfigContext)
  const selectProps = getCompProps('CityPicker', userDefaultProps, props)
  const {
    type,
    size,
    value,
    className,
    defaultOpen,
    disabled,
    borderType,
    showArrow = true,
    allowClear,
    prefixCls: customPrefixcls,
    onFocus,
    onBlur,
    onClear,
    onVisibleChange,
    onChange,
    onSearch,
    defaultValue,
    placeholder,
    dropdownStyle = {},
    style,
    clearIcon,
    loading,
    showDescription,
    description,
    optionHighlightProps,
    popperStyle = {},
    commonList = [],
    domesticList = [],
    foreignList = [],
    itemRender,
  } = selectProps
  const [initValue, setInitValue] = useMergedState(undefined, {
    value,
    defaultValue,
  })
  const innerRef = useRef<HTMLElement>()
  const selectRef = (ref as any) || innerRef
  const searchRef = useRef<any>(null) // 搜索框ref
  const selectionRef = useRef<any>(null)
  const clearRef = useRef<HTMLSpanElement>(null)

  const [optionShow, setOptionShow] = useState<boolean>(
    typeof props.visible === 'undefined' ? !!defaultOpen : !!props.visible,
  )
  const [searchValue, setSearchValue] = useState<any>('')
  const [focusd, setFocusd] = useState(false)
  const [seletedCity, setSeletedCity] = useState<City | null>(null)
  const [tabsValue, setTabsValue] = useState<Type>('domestic')

  const isDomestic = (type: Type) => type === 'domestic'

  const selectPrefixCls = getPrefixCls!(prefixCls, 'city-picker', customPrefixcls)
  const cityPickerCls = classNames(selectPrefixCls, className, {
    [`${selectPrefixCls}-visible`]: optionShow,
  })

  const selectionCls = classNames({
    [`${selectPrefixCls}-selector`]: true,
  })

  // 公共样式
  const commCls = classNames({
    [`${selectPrefixCls}-bordered`]: borderType === 'bordered',
    [`${selectPrefixCls}-underline`]: borderType === 'underline',
    [`${selectPrefixCls}-borderless`]: borderType === 'none',
    [`${selectPrefixCls}-size-${size}`]: size,
    [`${selectPrefixCls}-wrapper`]: true,
    [`${selectPrefixCls}-show-search`]: focusd,
  })

  useEffect(() => {
    if (typeof value === 'undefined') return
    const cityList = [...commonList, ...domesticList, ...foreignList]
    const city = cityList.find((city) => city.id === value)
    if (city) {
      setSeletedCity(city)
    }
  }, [commonList, domesticList, foreignList, value])

  useEffect(() => {
    if (typeof props.visible !== 'undefined') {
      setOptionShow(props.visible)
    }
  }, [props.visible])

  useEffect(() => {
    if (optionShow === false) {
      handleClear()
    }
  }, [optionShow])

  const handleFocus = useCallback(
    (e: React.ChangeEvent<HTMLSpanElement>) => {
      e.stopPropagation()
      setFocusd(true)
      onFocus && onFocus(e)
    },
    [onFocus],
  )

  const handleBlur = useCallback(
    (e: React.ChangeEvent<HTMLSpanElement>) => {
      e.stopPropagation()
      setFocusd(false)
      onBlur && onBlur(e)
    },
    [onBlur],
  )

  useEffect(() => {
    selectionRef.current.addEventListener('mouseup', (e: MouseEvent) => {
      const isCloseBtn = (e?.target as Element)?.className.indexOf('kd-tag-close-icon') > -1
      if (isCloseBtn) {
        e.stopPropagation()
      }
    })
  }, [])

  // 输入框变化搜索内容
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const val = event.currentTarget.value
      setOptionShow(true)
      setSearchValue(val)
      onSearch?.(val)
    },
    [onSearch],
  )

  // 清除搜索内容
  const handleClear = useCallback(() => {
    if (searchRef.current) {
      searchRef.current.value = ''
      setSearchValue('')
    }
  }, [searchRef])

  // 清空选择器内容
  const handleReset = (e: any) => {
    e.stopPropagation()
    onClear && onClear('')
    setInitValue('')
    setSeletedCity(null)
    setSearchValue('')
    onChange && onChange(undefined, '')
  }

  // 渲染后缀图标
  const renderSuffix = () => {
    if (disabled) return null
    const { suffixIcon } = selectProps
    const arrowIconCls = classNames({
      [`${selectPrefixCls}-icon-arrow`]: true,
      [`${selectPrefixCls}-icon-arrow-up`]: optionShow,
      [`${selectPrefixCls}-icon-arrow-down`]: !optionShow,
      [`${selectPrefixCls}-icon-arrow-focus`]: optionShow,
    })

    const iconShow = allowClear && !disabled && ((initValue ?? '') !== '' || searchValue)

    return (
      <>
        {iconShow && (
          <span
            onClick={handleReset}
            onMouseDown={(e) => e.preventDefault()}
            className={`${selectPrefixCls}-icon-clear`}
            ref={clearRef}
          >
            {clearIcon || <Icon type="close-solid" />}
          </span>
        )}
        {showArrow && <span className={arrowIconCls}>{suffixIcon || <Icon type="arrow-down" />}</span>}
      </>
    )
  }

  // 下拉列表为空时显示的内容
  const renderNotContent = (msg: string) => {
    const { notFoundContent } = selectProps
    const emptyContent = notFoundContent || msg
    return <div className={`${selectPrefixCls}-dropdown-empty`}>{emptyContent}</div>
  }

  const getHighlightText = (text: string | undefined, inputValue: string | Array<string>) => {
    if (!inputValue || !text) return text
    const regex = new RegExp(
      Array.isArray(inputValue)
        ? inputValue.map((item) => `(${escapeRegExp(item)})`).join('|')
        : `(${escapeRegExp(inputValue)})`,
      'i',
    )

    const strArr = text?.split(regex)

    return (
      <>
        {strArr?.map((item: string, index: number) =>
          regex?.test(item) ? (
            <span key={index} className={`${selectPrefixCls}-highlight`}>
              {item}
            </span>
          ) : (
            <span key={index}>{item}</span>
          ),
        )}
      </>
    )
  }

  const handleOption = (city: City) => {
    handleVisibleChange(false)
    city?.id !== initValue && onChange?.(city?.id, city)
    if (typeof value === 'undefined') {
      setSeletedCity(city)
      setInitValue(city?.id)
    }
  }

  const renderNodeList = (data: CityList, notContent: string) => {
    if (!data.length) {
      return renderNotContent(notContent)
    }
    return (
      <div className={`${selectPrefixCls}-list`}>
        {data.map((item) => {
          return (
            <Option
              key={item.id}
              value={initValue}
              city={item}
              renderCityInfo={renderCityInfo}
              onChangeSelect={handleOption}
              itemRender={itemRender}
            >
              {searchValue ? getHighlightText(item?.name, item?.[optionHighlightProps] || searchValue) : item?.name}
            </Option>
          )
        })}
      </div>
    )
  }

  const renderLoading = () => (
    <div className={`${selectPrefixCls}-dropdown-loading`}>
      <Spin type="container" />
    </div>
  )

  const toggleTabPane = (type: Type) => {
    setTabsValue(type)
  }

  // 渲染下拉列表框
  const renderContent = () => {
    return loading ? (
      renderLoading()
    ) : (
      <>
        {searchValue ? (
          <>
            {isDomestic(type) && (
              <Tabs noContainer onChange={toggleTabPane} activeKey={tabsValue}>
                {tabsData.map((item) => (
                  <Tabs.TabPane key={item.id} tab={item.name}>
                    {item}
                  </Tabs.TabPane>
                ))}
              </Tabs>
            )}

            {tabsValue === 'domestic'
              ? renderNodeList(domesticList, '暂无数据')
              : renderNodeList(foreignList, '暂无数据')}
          </>
        ) : (
          <>
            {!!commonList.length && <div className={`${selectPrefixCls}-dropdown-common`}>常用</div>}
            {renderNodeList(commonList, '无常用城市')}
          </>
        )}
      </>
    )
  }

  const renderCityInfo = useCallback(
    (data: City | null, flag = false, symbol = ', ') => {
      if (!data) return null
      if (isDomestic(type)) {
        return `${flag && data?.province ? symbol : ''}${data?.province}`
      } else {
        return `${flag && data?.province ? symbol : ''}${data?.province}${data?.country ? symbol : ''}${data?.country}`
      }
    },
    [type],
  )

  const renderSingle = () => {
    const hiddenStyle = !!searchValue || (initValue ?? '') !== '' ? { visibility: 'hidden' as const } : undefined
    return (
      <>
        <div className={singleCls} ref={selectionRef}>
          <div className={`${selectPrefixCls}-content`}>
            <span className={`${selectPrefixCls}-content-search`}>
              <input
                ref={searchRef}
                value={searchValue}
                className={`${selectPrefixCls}-content-search-input`}
                onChange={handleSearchChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                readOnly={!!disabled}
              />
              {!searchValue && (
                <span className={`${selectPrefixCls}-content-item`} title={seletedCity?.name}>
                  {seletedCity?.name}
                </span>
              )}
            </span>
            {!searchValue && <span className={`${selectPrefixCls}-content-info`}>{renderCityInfo(seletedCity)}</span>}
          </div>
          <span className={`${selectPrefixCls}-placeholder`} style={hiddenStyle}>
            {placeholder}
          </span>
          <span className={`${selectPrefixCls}-suffix`}>{renderSuffix()}</span>
        </div>
      </>
    )
  }

  const singleCls = classNames(commCls, {
    [`${selectPrefixCls}-disabled`]: disabled,
    [`${selectPrefixCls}-focused`]: (!disabled && focusd) || optionShow,
  })

  useEffect(() => {
    if (optionShow && !disabled) {
      const { onDropdownVisibleChange } = selectProps
      onDropdownVisibleChange && onDropdownVisibleChange(true)
    }
  }, [optionShow])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      e.stopPropagation()
    }
    clearRef.current?.addEventListener('mouseup', fn)
    return () => {
      clearRef.current?.removeEventListener('mouseup', fn)
    }
  }, [initValue])

  const renderCityPicker = () => {
    return (
      <div className={cityPickerCls} ref={selectRef} style={style}>
        {showDescription && <span className={`${selectPrefixCls}-description`}>{description}</span>}
        <span
          className={selectionCls}
          tabIndex={disabled ? -1 : 0}
          onFocus={() => searchRef.current?.focus()}
          onBlur={() => searchRef.current?.blur()}
        >
          {renderSingle()}
        </span>
      </div>
    )
  }

  const catchStyle = () => {
    if (selectRef?.current) {
      const { width } = selectRef.current?.getBoundingClientRect()
      return {
        minWidth: width,
        maxWidth: 600,
        ...dropdownStyle,
        width: dropdownStyle?.width || 'auto',
        zIndex: 1050,
        ...popperStyle,
      }
    }
  }

  const handleVisibleChange = (visible: boolean) => {
    if (visible !== optionShow) {
      props.visible === undefined && setOptionShow(visible)
      onVisibleChange && onVisibleChange(visible)
    }
  }

  const popperProps = {
    ...selectProps,
    prefixCls: `${selectPrefixCls}-dropdown`,
    placement: 'bottomLeft',
    popperStyle: catchStyle(),
    defaultVisible: optionShow,
    visible: optionShow,
    onVisibleChange: handleVisibleChange,
    clickToClose: !searchValue,
  }
  return usePopper(renderCityPicker(), renderContent(), popperProps)
}

const Select = React.forwardRef<unknown, CityPickerProps>(InternalSelect)

Select.displayName = 'CityPicker'

export default Select
