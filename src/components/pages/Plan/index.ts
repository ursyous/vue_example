import { Component, Vue, Watch } from 'nuxt-property-decorator'
import CopyIcon from 'vue-material-design-icons/ContentCopy.vue'
import ArrowLeftIcon from 'vue-material-design-icons/ChevronLeft.vue'
import ChannelIcon from 'vue-material-design-icons/CircleDouble.vue'
import TargetIcon from 'vue-material-design-icons/Account.vue'
import FilterIcon from 'vue-material-design-icons/FilterVariant.vue'
import RecommendationIcon from 'vue-material-design-icons/Star.vue'
import SelectFilters from '@/components/pages/Plan/SelectFilters.vue'
import { RequestCreatePlan, RequestFilterItem, ResponsePlanOptions } from '@/api/plans'

interface VariablesState {
  filterVariableNo : number,
  filterVariableName : string,
  variableDataType : string,
  editorType : string,
  isRequired : string,
  isMultipleValue : string,
  minValue: string,
  maxValue: string,
  defaultValue : string,
  incrementalValue : number,
  filterVariableDetails : Array<VariableDetailsState>
}

interface VariableDetailsState {
  detailNo: number,
  stringValue: string,
  stringlabel: string
}

interface ResultSegment {
  target: Array<ResultTargetRecommendationsState>,
  filter: Array<ResultFilterState>,
  recommendations: Array<ResultTargetRecommendationsState>
}

interface ResultTargetRecommendationsState {
  filterNo: number,
  label: string,
  variables: Array<VariablesState>
}

interface ResultFilterState {
  label: string
  filterNo: number
  variables: Array<any>
  detailNo: number
  stringValue: string
  stringLabel: string
  numberValue: number
  minNumberValue: number
  maxNumberValue: number
  isIncludeLeft: string
  isIncludeRight: string
  variableDataType: string
}

@Component({
  components: {
    CopyIcon,
    ArrowLeftIcon,
    SelectFilters,
    ChannelIcon,
    TargetIcon,
    FilterIcon,
    RecommendationIcon,
  }
})

export default class Plan extends Vue {
  mallId = 'sample'
  planName : string = ''
  isActive : boolean = false
  planCampaign : number = 0

  planOptions : ResponsePlanOptions = {
    campaigns : [],
    channels : [],
    customers : [],
    products : [],
    filters : []
  }

  createPlanInfo : RequestCreatePlan = {
    campaignNo: 0,
    channelNo: [],
    customers: [],
    filters: [],
    isActive: this.isActive === false? 'F' : 'T',
    mallId: this.mallId,
    planName: '',
    products: []
  }

  resultSegment: ResultSegment = {
    target: [],
    filter: [],
    recommendations: []
  }

  contentsTypes : string[] = [ 'Recommandation', 'Pictures' ]
  isActiveModal : boolean= false
  checkedChannels: number[] = []

  layoutTypes : string[] = [ '2???', '3???', '4???' ]
  productInfoList : string[] = [ '?????? ?????????', '?????????', '?????????', '?????????', '??????????????????', '??????' ]
  selectedLayoutType : string = ''
  replacableProductYn : boolean = false
  sortBy : string = ''
  sortOptions : string[] = [ '?????? ????????? ????????? ??????', '?????? ????????? ????????? ??????', '?????? ????????? ????????? ??????' ]

  setResultSegment () {
    this.resultSegment = {
      target: this.$store.getters['plan/getPlanTargetOption'],
      filter: this.$store.getters['plan/getPlanFilterOption'],
      recommendations: this.$store.getters['plan/getPlanRecommendationsOption']
    }
  }

  getOptions ( optionName : string ): Array<any> {
    return this.planOptions[optionName]
  }

  getLabel (input: string): string | boolean {
    return this.capitalizeFirstLetter(input) || 'Default'
  }

  showEditModal (): void {
    this.isActiveModal = !this.isActiveModal
  }

  capitalizeFirstLetter (input: string): string | boolean {
    if (input.length === 0) {
      return false
    }
    return input.charAt(0).toUpperCase() + input.slice(1)
  }

  async savePlan (): Promise<void> {
    
    this.createPlanInfo.channelNo = this.checkedChannels
    this.createPlanInfo.customers = [ this.resultSegment.target[0].filterNo ]
    this.createPlanInfo.products = [ this.resultSegment.recommendations[0].filterNo ]
    this.createPlanInfo.filters = []

    this.resultSegment.filter.forEach( ( item ): void => {
      let filterParams: RequestFilterItem = {
        filterVariableNo: item.filterNo
      }

      if ( item.variableDataType === 'CODE' ) {
        filterParams.detailNo = item.detailNo
      } else if ( item.variableDataType === 'NUMBER' ) {
        filterParams.numberValue = item.numberValue
      } else if ( item.variableDataType === 'NUMBER_RANGE' ) {
        filterParams.minNumberValue = item.minNumberValue
        filterParams.maxNumberValue = item.maxNumberValue
        filterParams.isIncludeLeft = 'T'
        filterParams.isIncludeRight = 'T'
      }

      this.createPlanInfo.filters.push(filterParams)
    })

    const confirmResult = await this.$confirm('Plan??? ?????????????????????????')

    if ( confirmResult ) {
      this.$apiRepository.plans.createPlan(this.createPlanInfo).then(res =>  {
        console.log('response : ', res)
        this.$alert('?????? ??????').then(() => {
          this.$router.push('/campaigns')
        })
      }).catch(e => {
        console.log('error :', e)
        this.$alert('Plan ?????? ??????')
      })
    }
  }

  @Watch('planName')
  viewPlanName ( value: string) {
    this.createPlanInfo.planName = value
  }

  @Watch('isActive')
  viewIsActive ( value: boolean) {
    this.createPlanInfo.isActive = value === true ? 'T' : 'F'
  }

  @Watch('planCampaign')
  viewPlanCampaign ( value: number) {
    this.createPlanInfo.campaignNo = value
  }

  created () {
    this.$apiRepository.plans.getOptions(this.mallId).then(res => {
      this.planOptions = res
      if ( this.planOptions.campaigns.length > 0 ) this.planCampaign = this.planOptions.campaigns[0].campaignNo
    })

    this.$bus.$on('updateSegmentData', () => {
      this.setResultSegment()
    })
  }

  /**
   * Return to previous page
   */
  goBack (): void {
    if (confirm(`${this.$t('pages.Plan.backMsg')}`))
      window.history.back()
  }
}
